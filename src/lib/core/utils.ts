import fs from 'fs';
import path from 'path';

const ASSET_ROOT = path.join(process.cwd(), 'src', 'lib', 'assets');

export const readText = (rel: string): string =>
  fs.readFileSync(path.join(ASSET_ROOT, rel), 'utf8').trim();

export const readJSON = <T>(rel: string): T =>
  JSON.parse(readText(rel)) as T;

/** Shallow-merge two plain objects. */
export function mergeTone<T extends Record<string, unknown>, U extends Record<string, unknown>>(
  base: T,
  override: U
): T & U {
  return { ...base, ...override };
}
