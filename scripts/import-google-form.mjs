#!/usr/bin/env node
/**
 * Imports sign-ups exported from an old Google Form/Sheet ("Form Responses 1" → File → Download → CSV).
 *
 *   node --env-file=.env.local scripts/import-google-form.mjs <file.csv> <season> [--dry-run]
 *
 * Point the env file at the database you want (.env.local for local, .env.hosted for the live site).
 * Safe to run twice: sign-ups already imported (same season, email/company and time) are skipped.
 *
 * Understands both form layouts used so far:
 *   2026: Timestamp, Email Address, Company Name, Name, Address, Mobile, Opportunities…, player question
 *   2025: Timestamp, Company Name, "Which division(s)…", Kiwanis Banner Yes/No,
 *         one free-text "contact information" box (name, address, email, mobile), player question
 * Free-text contact info is split up as well as possible; the original text is kept in the notes.
 * A person who checked several boxes, or appears on several rows with the same timestamp, becomes one
 * sign-up with several sponsorships.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const [file, season] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const dryRun = process.argv.includes("--dry-run");
if (!file || !season) {
  console.error("Usage: node --env-file=.env.local scripts/import-google-form.mjs <file.csv> <season> [--dry-run]");
  process.exit(1);
}

// Choice text → package. Order matters (AAA before AA before A).
const PACKAGES = [
  { re: /^T[\s-]?Ball/i, name: "T-Ball team", kind: "team", sort: 10 },
  { re: /^AAA\b/i, name: "AAA team", kind: "team", sort: 40 },
  { re: /^AA\b/i, name: "AA team", kind: "team", sort: 30 },
  { re: /^A(\s+Ball)?\b(?!A)/i, name: "A Ball team", kind: "team", sort: 20 },
  { re: /^Majors/i, name: "Majors team", kind: "team", sort: 50 },
  { re: /^Juniors/i, name: "Juniors team", kind: "team", sort: 60 },
  { re: /Kiwanis|banner/i, name: "Kiwanis banner", kind: "banner", sort: 70 },
];
const BANNER = PACKAGES.find((p) => p.kind === "banner");
const DONT_KNOW = /don.?t know/i;
// "No", "NO", "nope", "none", "n/a" (optionally followed by more words) means no player.
const NO_PLAYER = /^(no|nope|none|n\/a)\b[.!,]?\s*/i;

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

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE = /(?<!\d)(?:\+?1[ .-]*)?\(?\d{3}\)?[ .-]*\d{3}[ .-]*\d{4}\b/; // one line only
const tidy = (s) =>
  s
    .replace(/\s*\n\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .replace(/(\s*,\s*)+/g, ", ")
    .replace(/^[\s,.\-–:]+|[\s,.\-–:]+$/g, "");

/** Splits "Name, address, email, phone" free text (in any order) into parts. */
function parseContact(blob) {
  let rest = blob.trim();
  const email = rest.match(EMAIL_RE)?.[0] ?? "";
  if (email) rest = rest.replace(email, " ");
  const phone = rest.match(PHONE_RE)?.[0]?.trim() ?? "";
  if (phone) rest = rest.replace(phone, " ");
  rest = rest.replace(/\b(mobile|cell|phone|email)\s*:/gi, " ");
  // The name is whatever comes first, up to a comma, period+space, line break, or the first digit.
  const m = rest.match(/^\s*([^,\n\d]*?)\s*(?:,|\.\s|\n|(?=\d)|$)/);
  const name = tidy(m?.[1] ?? "");
  const address = tidy(m ? rest.slice(m[0].length) : rest);
  return { name, email: email.toLowerCase(), phone, address };
}

const rows = parseCsv(readFileSync(file, "utf8").replace(/^﻿/, ""));
const header = rows.shift().map((h) => h.toLowerCase().trim());
const find = (pred) => header.findIndex(pred);
const C = {
  time: find((h) => h.startsWith("timestamp")),
  email: find((h) => h.startsWith("email")),
  company: find((h) => h.startsWith("company")),
  name: find((h) => h === "name"),
  address: find((h) => h.startsWith("address")),
  phone: find((h) => h.startsWith("mobile") || h.startsWith("phone")),
  contact: find((h) => h.includes("contact information")),
  opps: find((h) => h.startsWith("opportunities") || h.includes("which division")),
  banner: find((h) => h.includes("kiwanis") && !h.startsWith("opportunities")),
  player: find((h) => h.includes("player")),
};
const missing = ["time", "company", "opps"].filter((k) => C[k] < 0);
if (C.email < 0 && C.contact < 0) missing.push("email or contact information");
if (missing.length) {
  console.error(`Couldn't find these columns in the CSV header: ${missing.join(", ")}`);
  process.exit(1);
}
const cell = (r, i) => (i >= 0 ? (r[i] ?? "").trim() : "");
const bannerPrice = Number(header[C.banner]?.match(/\$\s*([\d,]+)/)?.[1]?.replace(/,/g, "") ?? 500) * 100;

// Group rows into sign-ups.
const groups = new Map();
const unknown = [];
for (const r of rows) {
  const contactText = cell(r, C.contact);
  const parsed = C.contact >= 0 ? parseContact(contactText) : null;
  const email = (cell(r, C.email) || parsed?.email || "").toLowerCase();
  const company = cell(r, C.company);
  const key = `${cell(r, C.time)}|${email || company.toLowerCase()}`;
  const g = groups.get(key) ?? {
    created_at: pacificToIso(cell(r, C.time)),
    email,
    company_name: company,
    contact_name: cell(r, C.name) || parsed?.name || "",
    address: cell(r, C.address) || parsed?.address || "",
    phone: cell(r, C.phone) || parsed?.phone || "",
    contact_text: contactText,
    player: cell(r, C.player),
    items: [],
    needs_division_help: false,
  };
  groups.set(key, g);

  const add = (pkg, price) => {
    if (!g.items.some((i) => i.name === pkg.name)) g.items.push({ ...pkg, price_cents: price });
  };

  // Several checked boxes arrive comma-separated; option text can contain commas too.
  const choices = cell(r, C.opps).split(/,\s*(?=T[\s-]?Ball|A\b|AA|Majors|Juniors|Kiwanis|I don)/i);
  for (const choice of choices.map((s) => s.trim()).filter(Boolean)) {
    if (DONT_KNOW.test(choice)) { g.needs_division_help = true; continue; }
    const pkg = PACKAGES.find((p) => p.re.test(choice));
    const price = Number(choice.match(/\$\s*([\d,]+)/)?.[1]?.replace(/,/g, "")) * 100;
    if (!pkg || !price) { unknown.push(choice); continue; }
    add(pkg, price);
  }
  if (/^y(es)?\b/i.test(cell(r, C.banner))) add(BANNER, bannerPrice);
}

if (unknown.length) {
  console.error("Didn't recognize these choices; fix the CSV or the PACKAGES list:\n  " + unknown.join("\n  "));
  process.exit(1);
}

const signups = [...groups.values()];
console.log(`${rows.length} rows → ${signups.length} sign-ups for season ${season}\n`);
for (const s of signups) {
  console.log(`${s.company_name}  →  ${s.items.map((i) => i.name).join(", ")}${s.needs_division_help ? " (+ division undecided)" : ""}`);
  if (C.contact >= 0) {
    console.log(`    name: ${s.contact_name || "—"} | email: ${s.email || "—"} | phone: ${s.phone || "—"} | address: ${s.address || "—"}`);
  }
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
  const { data: dupes } = await db
    .from("registrations")
    .select("id")
    .eq("season", season)
    .eq("email", s.email)
    .eq("company_name", s.company_name)
    .eq("created_at", s.created_at);
  if (dupes?.length) { skipped++; continue; }

  // "No" → no player; "No. Happy to sponsor any division." keeps the extra words as a note.
  const noPlayer = !s.player || NO_PLAYER.test(s.player);
  const extra = noPlayer ? s.player.replace(NO_PLAYER, "").trim() : "";
  const notes = [
    `Imported from the ${season} Google Form. Payments weren't tracked there.`,
    extra && `Form comment: ${extra}`,
    s.contact_text && `Contact info as entered: ${s.contact_text.replace(/\s*\n\s*/g, " / ")}`,
  ]
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
