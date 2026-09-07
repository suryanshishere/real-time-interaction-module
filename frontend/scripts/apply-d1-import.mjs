import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const databaseName = process.env.D1_DATABASE_NAME || "pollbuzz-db";
if (process.env.CONFIRM_PRODUCTION_IMPORT !== databaseName) {
  throw new Error(`Set CONFIRM_PRODUCTION_IMPORT=${databaseName} to confirm the remote import target.`);
}

const directory = path.resolve(".migration");
const manifest = JSON.parse(await readFile(path.join(directory, "manifest.json"), "utf8"));
if (!Array.isArray(manifest.files)) throw new Error("Invalid migration manifest.");
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

for (const filename of manifest.files) {
  console.log(`Applying ${filename}...`);
  const result = spawnSync(
    npx,
    ["wrangler", "d1", "execute", databaseName, "--remote", `--file=${path.join(directory, filename)}`, "--yes"],
    { stdio: "inherit" },
  );
  if (result.status !== 0) throw new Error(`D1 import failed at ${filename}.`);
}
console.log("D1 import completed.");
console.log(JSON.stringify(manifest.counts, null, 2));
