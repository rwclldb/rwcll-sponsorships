#!/usr/bin/env node
/**
 * Imports sign-ups exported from the old Google Form/Sheet ("Form Responses 1" → File → Download → CSV).
 *
 *   node --env-file=.env.local scripts/import-google-form.mjs <file.csv> <season> [--dry-run]
 *
 * Point the env file at the database you want (local .env.local, or a file with the hosted URL and
 * secret key). Safe to run twice: sign-ups already imported (same season, email and time) are skipped.
 *
 * Expected columns: Timestamp, Email Address, Company Name, Name, Address, Mobile, Opportunities…,
 * Do you have a player…. A person who checked several boxes, or appears on several rows with the same
 * timestamp, becomes one sign-up with several sponsorships.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const [file, season] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const dryRun = process.argv.includes("--dry-run");
if (!file || !season) {
  console.error("Usage: node --env-file=.env.local scripts/import-google-form.mjs <file.csv> <season> [--dry-run]");
  process.exit(1);
}

// Opportunity text → package. Order matters (AAA before AA).
const PACKAGES = [
  { re: /^T[\s-]?Ball/i, name: "T-Ball team", kind: "team", sort: 10 },
  { re: /^A Ball/i, name: "A Ball team", kind: "team", sort: 20 },
  { re: /^AAA\b/i, name: "AAA team", kind: "team", sort: 40 },
  { re: /^AA\b/i, name: "AA team", kind: "team", sort: 30 },
  { re: /^Majors/i, name: "Majors team", kind: "team", sort: 50 },
  { re: /^Juniors/i, name: "Juniors team", kind: "team", sort: 60 },
  { re: /Kiwanis|banner/i, name: "Kiwanis banner", kind: "banner", sort: 70 },
];
const DONT_KNOW = /don.?t know/i;

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((f) => f.trim()));
}

/** "1/27/2026 17:49:40" in Pacific time → ISO timestamp. */
function pacificToIso(stamp) {
  const [date, time = "0:00:00"] = stamp.trim().split(/\s+/);
  const [m, d, y] = date.split("/").map(Number);
  const [hh, mm, ss = 0] = time.split(":").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm, ss));
  const offset = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", timeZoneName: "longOffset" })
    .formatToParts(guess)
    .find((p) => p.type === "timeZoneName").value; // e.g. "GMT-08:00"
  const [, sign, oh, om] = offset.match(/GMT([+-])(\d{2}):(\d{2})/) ?? [, "-", "08", "00"];
  const minutes = (sign === "-" ? 1 : -1) * (Number(oh) * 60 + Number(om));
  return new Date(guess.getTime() + minutes * 60000).toISOString();
}

const rows = parseCsv(readFileSync(file, "utf8").replace(/^﻿/, ""));
const header = rows.shift().map((h) => h.toLowerCase());
const col = (pred) => {
  const i = header.findIndex(pred);
  if (i < 0) throw new Error("Couldn't find an expected column in the CSV header");
  return i;
};
const C = {
  time: col((h) => h.startsWith("timestamp")),
  email: col((h) => h.startsWith("email")),
  company: col((h) => h.startsWith("company")),
  name: col((h) => h === "name"),
  address: col((h) => h.startsWith("address")),
  phone: col((h) => h.startsWith("mobile") || h.startsWith("phone")),
  opps: col((h) => h.startsWith("opportunities")),
  player: col((h) => h.includes("player")),
};

// Group rows into sign-ups.
const groups = new Map();
const unknown = [];
for (const r of rows) {
  const email = r[C.email].trim().toLowerCase();
  const key = `${r[C.time].trim()}|${email}`;
  const g = groups.get(key) ?? {
    created_at: pacificToIso(r[C.time]),
    email,
    company_name: r[C.company].trim(),
    contact_name: r[C.name].trim(),
    address: r[C.address].trim(),
    phone: r[C.phone].trim(),
    player: r[C.player].trim(),
    items: [],
    needs_division_help: false,
  };
  groups.set(key, g);

  // Several checked boxes arrive comma-separated; option text can contain commas too.
  const choices = r[C.opps].split(/,\s*(?=T[\s-]?Ball|A Ball|AA|Majors|Juniors|Kiwanis|I don)/i);
  for (const choice of choices.map((s) => s.trim()).filter(Boolean)) {
    if (DONT_KNOW.test(choice)) { g.needs_division_help = true; continue; }
    const pkg = PACKAGES.find((p) => p.re.test(choice));
    const price = Number(choice.match(/\$\s*([\d,]+)/)?.[1]?.replace(/,/g, "")) * 100;
    if (!pkg || !price) { unknown.push(choice); continue; }
    if (!g.items.some((i) => i.name === pkg.name)) g.items.push({ ...pkg, price_cents: price });
  }
}

if (unknown.length) {
  console.error("Didn't recognize these choices; fix the CSV or the PACKAGES list:\n  " + unknown.join("\n  "));
  process.exit(1);
}

const signups = [...groups.values()];
console.log(`${rows.length} rows → ${signups.length} sign-ups for season ${season}`);
for (const s of signups) {
  console.log(`  ${s.company_name.padEnd(42)} ${s.items.map((i) => i.name).join(", ")}${s.needs_division_help ? " (+ division undecided)" : ""}`);
}
if (dryRun) process.exit(0);

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});
console.log(`\nImporting into ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);

// Make sure the season has packages so imported items link to them.
const { data: existingPkgs, error: pkgErr } = await db.from("packages").select("id, name").eq("season", season);
if (pkgErr) throw pkgErr;
const pkgIds = new Map(existingPkgs.map((p) => [p.name, p.id]));
for (const s of signups) {
  for (const i of s.items) {
    if (pkgIds.has(i.name)) continue;
    const { data, error } = await db
      .from("packages")
      .insert({ season, kind: i.kind, name: i.name, price_cents: i.price_cents, sort_order: i.sort })
      .select("id")
      .single();
    if (error) throw error;
    pkgIds.set(i.name, data.id);
  }
}

let added = 0, skipped = 0;
for (const s of signups) {
  const { data: dupe } = await db
    .from("registrations")
    .select("id")
    .eq("season", season)
    .eq("email", s.email)
    .eq("created_at", s.created_at)
    .maybeSingle();
  if (dupe) { skipped++; continue; }

  // "No" → no player; "No. Happy to sponsor any division." keeps the extra words as a note.
  const noPlayer = /^no\b/i.test(s.player) || !s.player;
  const extra = noPlayer ? s.player.replace(/^no\b[.!,]?\s*/i, "").trim() : "";
  const notes = [`Imported from the ${season} Google Form. Payments weren't tracked there.`, extra && `Form comment: ${extra}`]
    .filter(Boolean)
    .join("\n");

  const { data: reg, error } = await db
    .from("registrations")
    .insert({
      season,
      created_at: s.created_at,
      email: s.email,
      company_name: s.company_name,
      contact_name: s.contact_name,
      address: s.address,
      phone: s.phone,
      player_info: noPlayer ? null : s.player,
      needs_division_help: s.needs_division_help,
      status: "confirmed",
      imported: true,
      notes,
    })
    .select("id")
    .single();
  if (error) throw error;

  if (s.items.length) {
    const { error: itemErr } = await db.from("registration_items").insert(
      s.items.map((i) => ({
        registration_id: reg.id,
        package_id: pkgIds.get(i.name),
        kind: i.kind,
        name: i.name,
        price_cents: i.price_cents,
      })),
    );
    if (itemErr) throw itemErr;
  }
  added++;
}
console.log(`Done: ${added} imported, ${skipped} already there.`);
