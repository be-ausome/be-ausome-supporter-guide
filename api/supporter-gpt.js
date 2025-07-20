/* ─── START /api/supporter-gpt.js ──────────────────────────────────────── */
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, "..", "content");

/* Globals populated once on cold-start */
let routerObj     = {};   // role → rules[]
let scriptIndex   = {};   // script_id → full text block
let contentLoaded = false;

/* ------------------------------------------------------------- */
/*  Load & index content files – runs exactly once per cold start */
/* ------------------------------------------------------------- */
async function loadContentOnce() {
  if (contentLoaded) return;

  /* 1. Router JSON */
  routerObj = JSON.parse(
    await fs.readFile(
      path.join(
        CONTENT_DIR,
        "supporter_prompt_router_GALACTIC_CORE_descriptive_v3_SECURE.json"
      ),
      "utf8"
    )
  );

  /* 2. Script TXT  ->  build scriptIndex */
  const txt = await fs.readFile(
    path.join(
      CONTENT_DIR,
      "supporter_script_library_REAL_CONTENT_v14.txt"
    ),
    "utf8"
  );

  let currentId = null;
  let buffer    = [];

  txt.split(/\r?\n/).forEach(line => {
    const idMatch = line.match(/^###\s*(\S+)/);   // heading line?
    if (idMatch) {
      if (currentId) {
        scriptIndex[currentId] = buffer.join("\n");
      }
      currentId = idMatch[1].trim();
      buffer    = [line];                         // reset buffer
    } else if (currentId) {
      buffer.push(line);
    }
  });
  if (currentId) scriptIndex[currentId] = buffer.join("\n");

  contentLoaded = true;
  console.log(
    `[Supporter-GPT] content loaded → roles:${Object.keys(routerObj).length
    } | scripts:${Object.keys(scriptIndex).length}`
  );
}

/* ------------------------------------------------------------- */
/*  Main handler                                                 */
/* ------------------------------------------------------------- */
export default async function handler(req, res) {
  await loadContentOnce();                        // ensure content ready

  /* Health-check for GET */
  if (req.method !== "POST") {
    return res.status(200).json({
      ok: true,
      message: "Supporter GPT loader ready",
      roles: Object.keys(routerObj).length,
      scripts: Object.keys(scriptIndex).length
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

  /* 1️⃣  Choose rules list */
  let rulesToSearch;
  if (user_role && routerObj[user_role]) {
    rulesToSearch = routerObj[user_role];
  } else {
    /* Flatten all role arrays, ignoring meta keys */
    rulesToSearch = Object.values(routerObj)
                          .filter(Array.isArray)
                          .flat();
  }

  /* 2️⃣  Find first matching rule (simple keyword OR match) */
  const match = rulesToSearch.find(r => {
    if (!Array.isArray(r.keywords)) return false;
    try { return new RegExp(r.keywords.join("|"), "i").test(msgLower); }
    catch { return false; }
  });

  /* 3️⃣  Fallback if no match */
  if (!match) {
    const { __fallback_script__: fbScript = null } = routerObj;
    return res.status(200).json({
      ok: true,
      script_id: null,
      output: {
        text_message: "(fallback) I’m not sure how to help—could you rephrase?",
        suggested_script: fbScript
      }
    });
  }

  /* 4️⃣  Return the script block */
  const { script_id } = match;
  const scriptBlock   = scriptIndex[script_id] || null;

  return res.status(200).json({
    ok: true,
    script_id,
    raw_block: scriptBlock ?? "(script not found)"
  });
}
/* ─── END /api/supporter-gpt.js ────────────────────────────────────────── */
