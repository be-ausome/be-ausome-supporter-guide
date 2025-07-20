/* ── /api/supporter-gpt.js — role-aware router + YAML-style block index ── */
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, "..", "content");

let routerObj     = {};   // role → rules[]
let scriptIndex   = {};   // script_id → full block
let contentLoaded = false;

/* ---------- Load content once ---------- */
async function loadContentOnce() {
  if (contentLoaded) return;

  /* 1 – router JSON (object keyed by supporter role) */
  routerObj = JSON.parse(
    await fs.readFile(
      path.join(
        CONTENT_DIR,
        "supporter_prompt_router_GALACTIC_CORE_descriptive_v3_SECURE.json"
      ),
      "utf8"
    )
  );

  /* 2 – TXT script library → build scriptIndex */
  const txt = await fs.readFile(
    path.join(
      CONTENT_DIR,
      "supporter_script_library_REAL_CONTENT_v14.txt"
    ),
    "utf8"
  );

  // Split on '---' lines (YAML front-matter style)
  const blocks = txt.split(/^---\s*$/m).filter(b => b.trim());
  blocks.forEach(block => {
    // Find the first “script_id:” line
    const idMatch = block.match(/^\s*script_id:\s*("?)([A-Za-z0-9_\-]+)\1/m);
    if (!idMatch) return;
    const id = idMatch[2];
    if (!id || id.toLowerCase() === "none") return;   // skip placeholder
    scriptIndex[id] = block.trim();
  });

  contentLoaded = true;
  console.log(
    `[Supporter-GPT] loaded roles:${Object.keys(routerObj).length
    } | scripts:${Object.keys(scriptIndex).length}`
  );
}

/* ---------- Main handler ---------- */
export default async function handler(req, res) {
  await loadContentOnce();

  /* Simple GET health-check */
  if (req.method !== "POST") {
    return res.status(200).json({
      ok: true,
      message: "Supporter GPT loader ready",
      roles:   Object.keys(routerObj).length,
      scripts: Object.keys(scriptIndex).length
    });
  }

  /* Parse JSON body (Vercel may give it as string) */
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { message = "", user_role = "" } = body;
  if (!message) {
    return res.status(400).json({ error: "Missing 'message' field." });
  }
  const msgLower = message.toLowerCase();

  /* 1️⃣ pick rules to search */
  let rulesToSearch = [];
  if (user_role && routerObj[user_role]) {
    rulesToSearch = routerObj[user_role];
  } else {
    rulesToSearch = Object.values(routerObj)
                          .filter(Array.isArray)
                          .flat();
  }

  /* 2️⃣ naive keyword match */
  const match = rulesToSearch.find(r => {
    if (!Array.isArray(r.keywords) || !r.keywords.length) return false;
    try {
      return new RegExp(r.keywords.join("|"), "i").test(msgLower);
    } catch {
      return false;
    }
  });

  /* 3️⃣ fallback if no match */
  if (!match) {
    return res.status(200).json({
      ok: true,
      script_id: null,
      output: { text_message: "(fallback) Could you rephrase that for me?" }
    });
  }

  /* 4️⃣ return the script block */
  const { script_id } = match;
  const scriptBlock   = scriptIndex[script_id] || "(script not found)";

  return res.status(200).json({ ok: true, script_id, raw_block: scriptBlock });
}
