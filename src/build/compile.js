/**********************************************************************
 *  compile.js   —   Build-time bundler for the “bring-everything” plan
 *********************************************************************/
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

/*** 1.  CONFIG  ********************************************************/
const ROLE          = 'supporter';         // add more roles later
const OUT_DIR       = 'compiled';          // build output
const PATHS = {                            // where the raw files live
  sysPrompt        : 'system/supporter_guide_instructions_PUBLIC_FINAL.txt',
  router           : 'routing/supporter_prompt_router_GALACTIC_CORE_descriptive_v3_SECURE.json',
  scriptLibrary    : 'script_assets/supporter_script_library_REAL_CONTENT_v14.txt',
  scriptIndex      : 'script_assets/supporter_script_index_PATCH_FINAL.json',
  storyIndex       : 'script_assets/supporter_story_index_GALACTIC_CORE_RENAMED_FINAL.json',
  scenarioTags     : 'script_assets/supporter_scenario_tags_GALACTIC_CORE_UPDATED.json',
  closingLines     : 'script_assets/supporter_closing_lines.txt',
  repairsDir       : 'fallbacks',
  disclaimerTxt    : 'compliance/unified_supporter_legal_disclaimer2.txt',
  templatesTxt     : 'script_assets/supporter_script_templates_WITH_TEMPLATE_ID.txt' // not used yet
};

/*** 2.  HELPERS  *******************************************************/
function safeRead(fp) { return fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8') : ''; }
function loadRepairs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.txt'))
    .map(f => fs.readFileSync(path.join(dir, f), 'utf8').trim())
    .filter(Boolean);
}
function parseLibrary(raw) {
  return raw.split(/^-{3,}$/m)               // '---' divider
    .filter(Boolean)
    .map(block => {
      const { data, content } = matter(`---\n${block.trim()}`);
      return { ...data, content };
    });
}

/*** 3.  BUILD OUTPUT DIR  *********************************************/
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

/*** 4.  SYSTEM PROMPT  *************************************************/
const sysPrompt = safeRead(PATHS.sysPrompt);
fs.writeFileSync(
  `${OUT_DIR}/${ROLE}_sysPrompt.js`,
  `export const systemPrompt = ${JSON.stringify(sysPrompt)};`
);

/*** 5.  ROUTER  ********************************************************/
fs.copyFileSync(
  PATHS.router,
  `${OUT_DIR}/${ROLE}_router.json`
);

/*** 6.  SCRIPTS (merge library + index + disclaimer) *******************/
const libraryArr  = parseLibrary( safeRead(PATHS.scriptLibrary) );
const indexObj    = JSON.parse( safeRead(PATHS.scriptIndex) || '{}' );
const disclaimer  = safeRead(PATHS.disclaimerTxt);

const scriptsMerged = libraryArr.map(rec => {
  const meta = indexObj[rec.script_id] || {};
  let fullContent = rec.content.replace('{{LEGAL}}', disclaimer);
  return { ...rec, ...meta, content: fullContent };
});
fs.writeFileSync(
  `${OUT_DIR}/${ROLE}_scripts.json`,
  JSON.stringify(scriptsMerged)
);

/*** 7.  CLOSING LINES  *************************************************/
const closings = safeRead(PATHS.closingLines)
  .split(/\r?\n/)
  .map(l => l.trim())
  .filter(Boolean);
fs.writeFileSync(`${OUT_DIR}/${ROLE}_closings.json`, JSON.stringify(closings));

/*** 8.  REPAIRS  *******************************************************/
fs.writeFileSync(
  `${OUT_DIR}/${ROLE}_repairs.json`,
  JSON.stringify(loadRepairs(PATHS.repairsDir))
);

/*** 9.  STORY INDEX & TAGS (optional) **********************************/
if (fs.existsSync(PATHS.storyIndex))
  fs.copyFileSync(PATHS.storyIndex, `${OUT_DIR}/${ROLE}_story_index.json`);

if (fs.existsSync(PATHS.scenarioTags))
  fs.copyFileSync(PATHS.scenarioTags, `${OUT_DIR}/${ROLE}_scenario_tags.json`);

console.log('✅  Build complete — bundles written to /compiled');
