/* ─── START /api/supporter-gpt.js ───────────────────────────────────────── */
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, "..", "content");

/* 1️⃣  Load files once on cold-start */
let routerObj     = {};   // holds the whole role→rules object
let scriptRaw     = "";   // giant TXT script library
let contentLoaded = false;

async function loadContentOnce() {
  if (contentLoaded) return;
  try {
    routerObj = JSON.parse(
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
    console.log("[Supporter-GPT] 📚 content loaded");
  } catch (err) {
    console.error("❌ Failed to load content:", err);
    throw err;            // bubble up so Vercel shows 500
  }
}

/* 2️⃣  Main handler */
export default async function handler(req, res) {
  await loadContentOnce();

  /* Health-check path */
  if (req.method !== "POST") {
    return res.status(200).json({
      ok: true,
      message: "Supporter GPT loader ready",
      roles: Object.keys(routerObj).length,
      scriptChars: scriptRaw.length
    });
  }

  /* Parse body */
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { message = "", user_role = "" } = body;
  if (!message) {
    return res.status(400).json({ error: "Missing 'message' field." });
  }
  const msgLower = message.toLowerCase();

  /* 2-A Choose which rule list to search */
  let rulesToSearch;
  if (user_role && routerObj[user_role]) {
    rulesToSearch = routerObj[user_role];
  } else {
    rulesToSearch = Object.values(routerObj)
                          .filter(Array.isArray)
                          .flat();
  }

  /* 2-B Find first matching rule */
  const match = rulesToSearch.find(r => {
    try { return new RegExp(r.keywords.join("|"), "i").test(msgLower); }
    catch { return false; }
  });

  if (!match) {
    return res.status(200).json({
      ok: true,
      script_id: null,
      output: { text_message: "(fallback) Could you rephrase that for me?" }
    });
  }

  const { script_id } = match;

  /* 2-C Extract script block */
  const blockRegex = new RegExp(
    `###\\s*${script_id}[\\s\\S]*?(?=###\\s|$)`,
    "i"
  );
  const scriptBlock = (scriptRaw.match(blockRegex) || [null])[0];

  return res.status(200).json({
    ok: true,
    script_id,
    raw_block: scriptBlock ?? "(script not found)"
  });
}
/* ─── END /api/supporter-gpt.js ─────────────────────────────────────────── */
