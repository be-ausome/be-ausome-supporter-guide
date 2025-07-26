import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

const ASSET_ROOT = path.join(process.cwd(), 'src', 'lib', 'assets');
const OUT_ROOT   = path.join(process.cwd(), 'src', 'lib', 'generated');
fs.mkdirSync(OUT_ROOT, { recursive: true });

/* 1️⃣ ROUTER -------------------------------------------------- */
const routerPath = path.join(
  ASSET_ROOT,
  'routing',
  'supporter_prompt_router_GALACTIC_CORE_descriptive_v3_SECURE.json'
);
const router: unknown = JSON.parse(fs.readFileSync(routerPath, 'utf8'));

/* 2️⃣ TONES  (plain-text key:value) --------------------------- */
const toneText = fs.readFileSync(
  path.join(ASSET_ROOT, 'routing', 'supporter_tone_mapping_GALACTIC.txt'),
  'utf8'
);
const tones: Record<string, Record<string, unknown>> = {};
toneText
  .split('\n')
  .map(l => l.trim())
  .filter(Boolean)
  .forEach(line => {
    // Example line: cheerful_supporter: temperature=0.9; prefix="😊 "
    const [id, rest] = line.split(':');
    const obj: Record<string, unknown> = {};
    rest
      .split(';')
      .map(s => s.trim())
      .filter(Boolean)
      .forEach(kv => {
        const [k, v] = kv.split('=');
        const val = v?.trim().replace(/^"(.*)"$/, '$1');
        obj[k.trim()] =
          k.includes('temperature') || k.includes('max_tokens') ? Number(val) : val;
      });
    tones[id.trim()] = obj;
  });

/* 3️⃣ FALLBACKS  --------------------------------------------- */
const fbDir  = path.join(ASSET_ROOT, 'fallbacks');
const fallbacks: Record<string, string> = {};
fs.readdirSync(fbDir).forEach(file => {
  if (file.endsWith('.txt')) {
    const id = path.parse(file).name; // e.g., script_42_friendly
    fallbacks[id] = fs.readFileSync(path.join(fbDir, file), 'utf8').trim();
  }
});

/* 4️⃣ WRITE OUT ---------------------------------------------- */
fs.writeFileSync(path.join(OUT_ROOT, 'router.json'),     JSON.stringify(router));
fs.writeFileSync(path.join(OUT_ROOT, 'tones.json'),      JSON.stringify(tones));
fs.writeFileSync(path.join(OUT_ROOT, 'fallbacks.json'),  JSON.stringify(fallbacks));

console.log('🟢 Supporter assets compiled → src/lib/generated/');
