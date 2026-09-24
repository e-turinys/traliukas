import { spawnSync } from "node:child_process"
import { readFileSync, writeFileSync, renameSync } from "node:fs"

// Always local; never accepts --linked, a project ID or a connection URL.
const output = new URL("../src/lib/supabase/database.types.ts", import.meta.url)
const result = spawnSync("npx", ["--no-install", "supabase", "gen", "types", "typescript", "--local", "--schema", "app,api"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })
if (result.status !== 0) {
  process.stderr.write(result.stderr || "Local database type generation failed\n")
  process.exit(1)
}
if (!result.stdout.includes("export type Database") || !result.stdout.includes("my_profile")) {
  throw new Error("CLI did not return the migrated foundation types")
}
if (process.argv.includes("--check")) {
  if (readFileSync(output, "utf8") !== result.stdout) throw new Error("Database types drifted; run npm run db:types")
} else {
  const temporary = new URL(`${output.href}.tmp`)
  writeFileSync(temporary, result.stdout)
  renameSync(temporary, output)
}
