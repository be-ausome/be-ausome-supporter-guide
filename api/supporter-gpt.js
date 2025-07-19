// /api/supporter-gpt.js  — Step 3-A loader
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, "..", "content");

/* ---------- load every file once on cold-start ---------- */
let routerRules = [];
let scriptRaw = "";
let contentLoaded = false;

async function loadContentOnce() {
  if (contentLoaded) return;        // hot reuse
  try {
    routerRules = JSON.parse(
      await fs.readFile(
        path.join(
          CONTENT_DIR,
          "supporter_prompt_router_GALACTIC_CORE_descriptive_v3_SECURE.json"
        ),
        "utf8"
      )
    );

    scriptRaw = await fs.readFile(
      path.join(
        CONTENT_DIR,
        "supporter_script_library_REAL_CONTENT_v14.txt"
      ),
      "utf8"
    );

    contentLoaded = true;
    console.log("[Supporter-GPT] Content library loaded ✅");
  } catch (err) {
    console.error("❌ Failed to load content files:", err);
    throw err;                      // fail the function so Vercel shows an error
  }
}
{
  "version": 2,
  "functions": {
    "api/**/*.js": {
      "runtime": "vercel/node@20",
      "includeFiles": "content/**"
    }
  }
}


/* ---------- API handler ---------- */
export default async function handler(req, res) {
  await loadContentOnce();

  return res.status(200).json({
    ok: true,
    message: "Content library loaded into memory",
    routerRules: routerRules.length,
    scriptChars: scriptRaw.length
  });
}
