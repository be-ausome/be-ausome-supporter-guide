/**
 * scripts/build-router.ts
 *
 * Copies whatever routing file contains "GALACTIC_CORE"
 * into src/lib/config/router.json so the app can import it
 * with a stable path.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const assetsDir = path.join(process.cwd(), "src", "lib", "assets", "routing");
const outDir    = path.join(process.cwd(), "src", "lib", "config");
const outFile   = path.join(outDir, "router.json");

async function main() {
  // find the master router (filename contains GALACTIC_CORE)
  const files = await fs.readdir(assetsDir);
  const master = files.find(f => f.includes("GALACTIC_CORE"));
  if (!master) {
    throw new Error("No routing file containing 'GALACTIC_CORE' found!");
  }

  const data = await fs.readFile(path.join(assetsDir, master), "utf8");

  // make sure output folder exists
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(outFile, data);

  console.log("✅ Router copied →", path.relative(process.cwd(), outFile));
}

main().catch(err => {
  console.error("❌ build-router failed:", err);
  process.exit(1);
});
