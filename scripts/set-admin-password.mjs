#!/usr/bin/env node
/**
 * Sets (or resets) the sign-in password for an admin, without needing email.
 *
 *   node --env-file=.env.hosted scripts/set-admin-password.mjs name@rwcll.org
 *
 * The env file needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY for the database you
 * want (.env.local for local, .env.hosted for the live site). You'll be asked to type the
 * password twice; it isn't shown or saved anywhere except Supabase (hashed).
 * The email must already be in the admins list (Admin > Settings > Admins).
 */
import { createInterface } from "node:readline";
import { createClient } from "@supabase/supabase-js";

const email = (process.argv[2] ?? "").trim().toLowerCase();
if (!email) {
  console.error("Usage: node --env-file=.env.hosted scripts/set-admin-password.mjs name@rwcll.org");
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set (use --env-file).");
  process.exit(1);
}

// One prompt session for all questions, so piped input isn't lost between them.
const tty = Boolean(process.stdin.isTTY);
const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: tty });
const lines = rl[Symbol.asyncIterator]();
let muted = false;
if (tty) {
  // Hide typed characters while a password is being entered.
  const write = rl._writeToOutput.bind(rl);
  rl._writeToOutput = (s) => (muted ? undefined : write(s));
}

/** Asks a question and reads one line without showing what's typed. */
async function ask(question) {
  process.stdout.write(question);
  muted = true;
  const { value = "" } = await lines.next();
  muted = false;
  if (tty) process.stdout.write("\n");
  return value;
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
console.log(`Database: ${url}`);

const { data: admin, error: adminError } = await db.from("admins").select("email").eq("email", email).maybeSingle();
if (adminError) throw adminError;
if (!admin) {
  console.error(`${email} isn't in the admins list. Add them in Admin > Settings first.`);
  process.exit(1);
}

const password = await ask(`New password for ${email}: `);
if (password.length < 10) {
  console.error("Please use at least 10 characters.");
  process.exit(1);
}
const again = await ask("Type it again: ");
rl.close();
if (again !== password) {
  console.error("The passwords didn't match. Nothing was changed.");
  process.exit(1);
}

// Find the existing sign-in account, if any.
let user = null;
for (let page = 1; !user; page++) {
  const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
  if (error) throw error;
  user = data.users.find((u) => u.email?.toLowerCase() === email) ?? null;
  if (data.users.length < 200) break;
}

const { error } = user
  ? await db.auth.admin.updateUserById(user.id, { password, email_confirm: true })
  : await db.auth.admin.createUser({ email, password, email_confirm: true });
if (error) {
  console.error("Couldn't set the password:", error.message);
  process.exit(1);
}
console.log(`Done. ${email} can now sign in with this password.`);
