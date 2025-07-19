// /api/supporter-gpt.js  – Step 3-B-1 (single handler, loads + routes)
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, "..", "content");

/* ──────────── 1) Load files once on cold-start ──────────── */
let routerRules   = [];   // array of rules from JSON
let scriptRaw     = "";   // big TXT library
let contentLoaded = false;

async function loadContentOnce() {
  if (contentLoaded) return;
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
    console.log("[Supporter-GPT] 📚 Content library loaded ✅");
  } catch (err) {
    console.error("❌ Failed to load content files:", err);
    throw err;            // bubble to 500 so logs show cause
  }
}

/* ──────────── 2) API handler with minimal routing ──────────── */
export default async function handler(req, res) {
  await loadContentOnce();

  /** Health check for GET */
  if (req.method !== "POST") {
    return res.status(200).json({
      ok: true,
      message: "Supporter GPT loader ready",
      routerRules: routerRules.length,
      scriptChars: scriptRaw.length
    });
  }

  /** Validate body */
  const { message = "" } = req.body ?? {};
  if (!message) {
    return res.status(400).json({ error: "Missing 'message' field." });
  }

  const lowerMsg = message.toLowerCase();

  /* 1️⃣  Find first rule whose regex matches the message */
  const match = routerRules.find(rule => {
    try {
      return new RegExp(rule.pattern, "i").test(lowerMsg);
    } catch {
      return false; // skip malformed regexes
    }
  });

  if (!match) {
    /* TEMP simple fallback */
    return res.status(200).json({
      ok: true,
      script_id: null,
      output: {
        text_message:
          "(fallback) I’m not sure how to help—could you rephrase?"
      }
    });
  }

  const { script_id } = match;

  /* 2️⃣  Extract the script block from TXT library */
  const regex = new RegExp(
    `###\\s*${script_id}[\\s\\S]*?(?=###\\s|$)`,
    "i"
  );
  const scriptBlock = (scriptRaw.match(regex) || [null])[0];

  return res.status(200).json({
    ok: true,
    script_id,
    raw_block: scriptBlock ?? "(script not found)"
  });
}
