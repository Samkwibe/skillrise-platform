#!/usr/bin/env node
/**
 * Smoke-test external validation (Bloombox, MailSniper, NumVerify).
 * Run: cd web && node --env-file=.env.local scripts/check-validation-providers.mjs
 * Does not print API keys.
 */
const bloombox = process.env.BLOOMBOX_EMAIL_VALIDATE_URL || "https://rapid-email-verifier.fly.dev/api/validate";

let hadError = false;

async function testBloombox() {
  const r = await fetch(bloombox, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "smoke-test@gmail.com" }),
  });
  const j = await r.json();
  if (!r.ok) {
    console.log("Bloombox: FAIL", r.status, typeof j === "object" ? JSON.stringify(j).slice(0, 200) : j);
    hadError = true;
    return;
  }
  console.log("Bloombox: OK (status=" + (j.status || "?") + ")");
}

async function testMailsniper() {
  const key = process.env.MAILSNIPER_API_KEY?.trim();
  if (!key) {
    console.log("MailSniper: SKIP (MAILSNIPER_API_KEY empty)");
    return;
  }
  if (key.length < 8) {
    console.log("MailSniper: FAIL (key looks too short — check .env.local for typos or extra spaces)");
    hadError = true;
    return;
  }
  const u = `https://api.mailsniperapp.com/v1/verify/email/${encodeURIComponent("smoke-test@gmail.com")}`;
  const mr = await fetch(u, { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" } });
  const mj = await mr.json();
  if (!mr.ok) {
    const code = mj.error_code || mj.message || mr.status;
    console.log("MailSniper: FAIL", mr.status, code);
    if (mj.error_code === "api_key_format_invalid" || mr.status === 401) {
      console.log("  → Copy the key from the MailSniper dashboard. No spaces/quotes; one line only.");
    }
    hadError = true;
    return;
  }
  console.log("MailSniper: OK (is_valid=" + mj.is_valid + ", is_disposable=" + mj.is_disposable + ")");
}

async function testNumverify() {
  const nv = process.env.NUMVERIFY_API_KEY?.trim();
  if (!nv) {
    console.log("NumVerify: SKIP (NUMVERIFY_API_KEY empty)");
    return;
  }
  if (nv.length < 8) {
    console.log("NumVerify: FAIL (key looks too short — check .env.local)");
    hadError = true;
    return;
  }
  const nUrl = new URL("https://apilayer.net/api/validate");
  nUrl.searchParams.set("access_key", nv);
  nUrl.searchParams.set("number", "14158586273");
  const nr = await fetch(nUrl);
  const nj = await nr.json();
  if (nj.success === false && nj.error) {
    console.log("NumVerify: FAIL", nj.error.code, nj.error.type, "-", (nj.error.info || "").slice(0, 120));
    if (Number(nj.error.code) === 101 || nj.error.type === "invalid_access_key") {
      console.log("  → Regenerate the key on numverify.com and paste it again (no quotes).");
    }
    hadError = true;
    return;
  }
  if (nj.valid !== true) {
    console.log("NumVerify: FAIL (valid != true)", JSON.stringify(nj).slice(0, 200));
    hadError = true;
    return;
  }
  console.log("NumVerify: OK (sample US mobile, valid=true, country=" + (nj.country_name || "?") + ")");
}

async function main() {
  await testBloombox();
  await testMailsniper();
  await testNumverify();
  if (hadError) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
