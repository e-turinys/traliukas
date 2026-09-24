import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { randomInt } from "node:crypto"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

// Local CLI only. Temporarily configures managed Auth's test-OTP feature;
// restores the tracked configuration even when startup fails. No SMS provider.
const root = fileURLToPath(new URL("../", import.meta.url))
const config = new URL("../supabase/config.toml", import.meta.url)
const original = readFileSync(config, "utf8")
if (!original.includes('project_id = "traliukas"') || !original.includes('api_url = "http://127.0.0.1"')
  || original.includes("[auth.sms.test_otp]")) throw new Error("Expected the unchanged local-only configuration")
const phone = process.env.PARVEZK_TEST_PHONE ?? "37060000999"
if (!/^[1-9][0-9]{7,14}$/.test(phone)) throw new Error("Use digits with country code for the local test phone")
const token = String(randomInt(0, 1000000)).padStart(6, "0")
const destination = new URL("../supabase/.temp/local-phone-auth.json", import.meta.url)
mkdirSync(new URL("../supabase/.temp/", import.meta.url), { recursive: true })
function cli(command) {
  const result = spawnSync("npx", ["--no-install", "supabase", command], { cwd: root, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" })
  if (result.status !== 0) throw new Error(`Local Supabase ${command} failed`)
}
try {
  // CLI 2.117 enables phone Auth only when an SMS provider is enabled, even
  // with TestOTP. These deliberately invalid placeholders are local-only;
  // the mapped test number bypasses delivery inside managed Auth.
  writeFileSync(config, `${original}\n[auth.sms.test_otp]\n"${phone}" = "${token}"\n\n[auth.sms.twilio]\nenabled = true\naccount_sid = "local-test-only"\nmessage_service_sid = "local-test-only"\nauth_token = "local-test-only"\n`)
  cli("stop")
  cli("start")
  writeFileSync(destination, JSON.stringify({ phone: `+${phone}`, token }, null, 2)+"\n", { mode: 0o600 })
  console.log("Local phone test enabled. Read supabase/.temp/local-phone-auth.json locally; do not share it. Tracked config restored.")
} finally {
  writeFileSync(config, original)
}
