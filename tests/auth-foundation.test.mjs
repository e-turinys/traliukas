import { test } from "node:test"
import assert from "node:assert/strict"
import { parseSupabaseEnvironment } from "../src/lib/supabase/env.ts"
import { requireE164, requireOtp, safeAuthReturnPath, assertSameOrigin } from "../src/lib/auth/validation.ts"

const anon = `header.${Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url")}.signature`
const service = `header.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.signature`

test("configuration accepts local CLI anon values and HTTPS publishable values", () => {
  assert.deepEqual(parseSupabaseEnvironment("http://127.0.0.1:54321", anon), { url: "http://127.0.0.1:54321", key: anon, secureCookies: false })
  assert.equal(parseSupabaseEnvironment("https://example.test", "sb_publishable_test").secureCookies, true)
})
test("missing config, privileged keys and unsafe origins fail closed", () => {
  for (const [url, key] of [[undefined, undefined], ["https://example.test", undefined], ["http://example.test", anon], ["https://example.test",service], ["https://example.test","sb_secret_test"], ["https://example.test","garbage"], ["https://user:pass@example.test",anon]]) {
    assert.throws(() => parseSupabaseEnvironment(url,key))
  }
})
test("phone and OTP validation preserves channel proof inputs", () => {
  assert.equal(requireE164("+37060000000"), "+37060000000")
  for (const value of ["37060000000", "+012345", "+370 60000000", "+37060000000\n", ""]) assert.throws(() => requireE164(value))
  assert.equal(requireOtp("012345"), "012345")
  for (const value of ["12345", "1234567", "123abc", "123456\n"]) assert.throws(() => requireOtp(value))
})
test("post-auth destinations use an explicit local allowlist", () => {
  assert.equal(safeAuthReturnPath("/request/new"), "/request/new")
  for (const value of ["//evil.test", "https://evil.test", "/\\evil.test", "javascript:alert(1)", "/%2f%2fevil.test", undefined]) assert.equal(safeAuthReturnPath(value), "/")
})
test("mutation origin checks reject missing, cross-site and spoofed hosts", () => {
  assert.doesNotThrow(() => assertSameOrigin("https://example.test", "https://example.test", "same-origin"))
  for (const origin of [null,"null","https://evil.test","https://example.test.evil.test","http://example.test"]) assert.throws(() => assertSameOrigin(origin,"https://example.test"))
  assert.throws(() => assertSameOrigin("https://example.test","https://example.test","cross-site"))
})
