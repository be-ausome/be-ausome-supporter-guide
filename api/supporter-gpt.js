/* ─── START /api/supporter-gpt.js ───────────────────────────────────────── */
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, "..", "content");

// Globals
let routerObj     = {};    // role → rules[]
let scriptMeta    = {};    // script_id → { metadata fields + body }
let contentLoaded = false;

// slugify helper
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

// Map your delivery_format values to JSON keys
const formatMap = {
  text_message:    "text_message",
  email:           "email",
  printable_card:  "printable",
  voice_note:      "voice_note",
  social_media_post: "social_caption",
  guide:           "guide"
};

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

  // 2️⃣ Load & parse script library TXT
  const txtLines = (
    await fs.readFile(
      path.join(CONTENT_DIR, "supporter_script_library_REAL_CONTENT_v14.txt"),
      "utf8"
    )
  ).split(/\r?\n/);

  // Find all '---' markers
  const markers = txtLines
    .map((l, i) => (l.trim() === "---" ? i : -1))
    .filter(i => i >= 0);

  // Process in pairs: metadata is between markers[i] & markers[i+1]
  for (let i = 0; i < markers.length - 1; i += 2) {
    const metaStart = markers[i];
    const metaEnd   = markers[i+1];
    const next      = markers[i+2] || txtLines.length;

    const metaLines    = txtLines.slice(metaStart + 1, metaEnd);
    const bodyLines    = txtLines.slice(metaEnd + 1, next);
    const meta         = {};
    let   scriptId     = null;

    // Parse each metadata line KEY: VALUE
    metaLines.forEach(line => {
      const [key, ...rest] = line.split(":");
      if (!rest.length) return;
      const val = rest.join(":").trim().replace(/^"(.*)"$/, "$1");
      meta[key.trim()] = val;
      if (key.trim() === "script_id") {
        scriptId = val;
      }
    });

    // Skip blocks without a real script_id
    if (!scriptId || scriptId.toLowerCase() === "none") continue;

    // Slugify scenario to guard against mismatch
    if (meta.scenario) {
      const slug = slugify(meta.scenario);
      scriptId = slug;
      meta.script_id   = slug;
      meta.template_id = slug;
    }

    // Join metadata + body for completeness
    scriptMeta[scriptId] = {
      ...meta,
      body: bodyLines.filter(l => l.trim()).join("\n")
    };
  }

  contentLoaded = true;
  console.log(
    `[Supporter-GPT] Loaded ${Object.keys(routerObj).length} roles & ` +
    `${Object.keys(scriptMeta).length} scripts`
  );
}

export default async function handler(req, res) {
  await loadContentOnce();

  // Health-check for GET
  if (req.method !== "POST") {
    return res.status(200).json({
      ok:      true,
      message: "Supporter GPT loader ready",
      roles:   Object.keys(routerObj).length,
      scripts: Object.keys(scriptMeta).length
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

  // 1️⃣ Pick role-based rules
  let rules = Array.isArray(routerObj[user_role])
    ? routerObj[user_role]
    : Object.values(routerObj)
        .filter(Array.isArray)
        .flat();

  // 2️⃣ Find a match by keywords
  const match = rules.find(r => {
    if (!Array.isArray(r.keywords)) return false;
    return new RegExp(r.keywords.join("|"), "i").test(msgLower);
  });

  // 3️⃣ Fallback if nothing matched
  if (!match) {
    return res.status(200).json({
      ok:        true,
      script_id: null,
      output: {
        text_message: "(fallback) Could you rephrase that for me?"
      },
      disclaimer:
        "This conversation isn’t saved. For your privacy, nothing you share is remembered."
    });
  }

  // 4️⃣ We have a match!
  const { script_id, tone_tags = [], alt_scripts = [] } = match;
  const info = scriptMeta[script_id] || {};

  // Build the output for the requested delivery_format
  const key   = formatMap[info.delivery_format] || "text_message";
  const output = { [key]: info.body };

  // Next steps: human-friendly alt_scripts (limit 3)
  const next_steps = alt_scripts.slice(0, 3).map(id =>
    id.replace(/_/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase())
  );

  return res.status(200).json({
    ok:         true,
    script_id,
    tone:       info.narrator_profile || tone_tags[0] || null,
    output,
    next_steps,
    disclaimer:
      "This conversation isn’t saved. For your privacy, nothing you share is remembered."
  });
}
/* ─── END /api/supporter-gpt.js ─────────────────────────────────────────── */
