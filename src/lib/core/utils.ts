import fs from 'fs';
import path from 'path';

const ASSET_ROOT = path.join(process.cwd(), 'src', 'lib', 'assets');

export const readText = (relativePath: string): string =>
  fs.readFileSync(path.join(ASSET_ROOT, relativePath), 'utf8').trim();

export const readJSON = <T = any>(relativePath: string): T =>
  JSON.parse(readText(relativePath));

/** Merge default tone with route-specific overrides */
export function mergeTone(base: any, override: any): any {
  return { ...base, ...override };
}
