/* ─── START /api/supporter-gpt.js ───────────────────────────────────────── */
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, "..", "content");

let routerObj     = {};   // role → rules[]
let scriptIndex   = {};   // script_id → full block
let contentLoaded = false;

// Simple slugifier (lowercase, non-alphanum → underscore)
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

async function loadContentOnce() {
  if (contentLoaded) return;

  // 1️⃣ Load router JSON
  routerObj = JSON.parse(
    await fs.readFile(
      path.join(
        CONTENT_DIR,
        "supporter_prompt_router_GALACTIC_CORE_descriptive_v3_SECURE.json"
      ),
      "utf8"
    )
  );

  // 2️⃣ Load script library TXT
  const txt   = await fs.readFile(
    path.join(
      CONTENT_DIR,
      "supporter_script_library_REAL_CONTENT_v14.txt"
    ),
    "utf8"
  );
  const lines = txt.split(/\r?\n/);

  // 3️⃣ Find every '---' marker line
  const markers = [];
  lines.forEach((line, i) => {
    if (line.trim() === "---") markers.push(i);
  });

  // 4️⃣ Iterate in pairs: [metaStart, metaEnd], content until next marker
  for (let i = 0; i < markers.length - 1; i += 2) {
    const metaStart = markers[i];
    const metaEnd   = markers[i+1];
    const nextMarker = markers[i+2];

    // Metadata lines between the two markers
    const metaLines = lines.slice(metaStart + 1, metaEnd);
    // Content lines until the next marker (or EOF)
    const contentLines = nextMarker != null
      ? lines.slice(metaEnd + 1, nextMarker)
      : lines.slice(metaEnd + 1);

    // Look for the scenario line in meta
    const scenarioLine = metaLines.find(l => l.trim().startsWith("scenario:"));
    if (!scenarioLine) continue;

    const match = scenarioLine.match(/scenario:\s*"([^"]+)"/);
    if (!match) continue;

    const slug = slugify(match[1]);
    // Combine metadata + content
    const block = metaLines.concat(contentLines).join("\n").trim();
    scriptIndex[slug] = block;
  }

  contentLoaded = true;
  console.log(
    `[Supporter-GPT] content loaded → roles:${Object.keys(routerObj).length
    } | scripts:${Object.keys(scriptIndex).length}`
  );
}

export default async function handler(req, res) {
  await loadContentOnce();

  // GET health-check
  if (req.method !== "POST") {
    return res.status(200).json({
      ok:      true,
      message: "Supporter GPT loader ready",
      roles:   Object.keys(routerObj).length,
      scripts: Object.keys(scriptIndex).length,
    });
  }

  // Parse JSON body
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { message = "", user_role = "" } = body;
  if (!message) {
    return res.status(400).json({ error: "Missing 'message' field." });
  }
  const msgLower = message.toLowerCase();

  // 1️⃣ Pick rules to search
  let rulesToSearch;
  if (user_role && routerObj[user_role]) {
    rulesToSearch = routerObj[user_role];
  } else {
    rulesToSearch = Object.values(routerObj)
                          .filter(Array.isArray)
                          .flat();
  }

  // 2️⃣ Naïve keyword find
  const match = rulesToSearch.find(r => {
    if (!Array.isArray(r.keywords)) return false;
    try {
      return new RegExp(r.keywords.join("|"), "i").test(msgLower);
    } catch {
      return false;
    }
  });

  // 3️⃣ Fallback
  if (!match) {
    return res.status(200).json({
      ok:        true,
      script_id: null,
      output: {
        text_message: "(fallback) Could you rephrase that for me?"
      }
    });
  }

  // 4️⃣ Return full block
  const { script_id } = match;
  const raw_block     = scriptIndex[script_id] || "(script not found)";

  return res.status(200).json({
    ok:          true,
    script_id,
    raw_block
  });
}
/* ─── END /api/supporter-gpt.js ─────────────────────────────────────────── */
