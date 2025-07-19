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

 /* ---------- API handler (step 3-B-1) ---------- */
export default async function handler(req, res) {
  await loadContentOnce();

  /* Health check for GET */
  if (req.method !== "POST") {
    return res.status(200).json({
      ok: true,
      message: "Supporter GPT loader ready",
      routerRules: routerRules.length,
      scriptChars: scriptRaw.length
    });
  }

  /* Validate input */
  const { message = "" } = req.body ?? {};
  if (!message) {
    return res.status(400).json({ error: "Missing 'message' field." });
  }

  const lowerMsg = message.toLowerCase();

  /* 1️⃣  Find the first matching router rule */
  const match = routerRules.find(rule => {
    try {
      return new RegExp(rule.pattern, "i").test(lowerMsg);
    } catch {
      return false;   // skip bad regexes in data
    }
  });

  if (!match) {
    /* TEMP fallback stub */
    return res.status(200).json({
      ok: true,
      script_id: null,
      output: {
        text_message: "(fallback) I’m not sure how to help—could you rephrase?"
      }
    });
  }

  const { script_id } = match;

  /* 2️⃣  Extract the raw script block from the TXT library.
         Each script starts with a heading line like  '### id:' */
  const regex = new RegExp(`###\\s*${script_id}[\\s\\S]*?(?=###\\s|$)`, "i");
  const scriptBlock = (scriptRaw.match(regex) || [null])[0];

  return res.status(200).json({
    ok: true,
    script_id,
    raw_block: scriptBlock ?? "(script not found)"
  });
}
