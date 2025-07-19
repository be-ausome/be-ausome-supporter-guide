// /api/supporter-gpt.js   – Step 3-A  (loader only)
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, "..", "content");

/* ───────────────── 1) Load the two key files once ───────────────── */
let routerRules   = [];   // array of routing patterns
let scriptRaw     = "";   // big TXT library
let contentLoaded = false;

async function loadContentOnce() {
  if (contentLoaded) return;               // hot-start reuse
  try {
    /* 1-A  Load the JSON router rules */
    routerRules = JSON.parse(
      await fs.readFile(
        path.join(
          CONTENT_DIR,
          "supporter_prompt_router_GALACTIC_CORE_descriptive_v3_SECURE.json"
        ),
        "utf8"
      )
    );

    /* 1-B  Load the raw script library (TXT) */
    scriptRaw = await fs.readFile(
      path.join(
        CONTENT_DIR,
        "supporter_script_library_REAL_CONTENT_v14.txt"
      ),
      "utf8"
    );

    contentLoaded = true;
    console.log("[Supporter-GPT] 📚 Content library loaded ✅");
  } catch (err) {
    console.error("❌ Failed to load content files:", err);
    throw err;                              // let Vercel emit 500
  }
}

/* ───────────────── 2)  API handler ───────────────── */
export default async function handler(req, res) {
  await loadContentOnce();                  // ensure files are in memory

  /* For step 3-A we just confirm load counts */
  return res.status(200).json({
    ok:            true,
    message:       "Content library loaded into memory",
    routerRules:   routerRules.length,      // e.g., 58
    scriptChars:   scriptRaw.length         // e.g., 472130
  });
}
