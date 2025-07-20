/**
 * src/lib/generatePrompt.ts
 *
 * Minimal prompt builder for local testing.
 * Later you can wire in full tone/router logic.
 */

import fs from "node:fs/promises";
import path from "node:path";
import type { ChatCompletionMessageParam } from "openai/resources/chat";

/** Helper: read any text asset relative to src/lib/assets/ */
async function readAsset(rel: string): Promise<string> {
  const abs = path.join(process.cwd(), "src", "lib", "assets", rel);
  return fs.readFile(abs, "utf8");
}

export async function buildMessages(opts: {
  userMessage: string;
  history: ChatCompletionMessageParam[];
}) {
  /* ---------- 1. Compliance / legal block ---------- */
  const legal = await readAsset(
    "compliance/unified_supporter_legal_disclaimer2.txt"
  );

  /* ---------- 2. Role profile (choose first *.txt in roles/) ---------- */
  const rolesDir = path.join(
    process.cwd(),
    "src",
    "lib",
    "assets",
    "roles"
  );
  const dirents = await fs.readdir(rolesDir, { withFileTypes: true });

  // pick the first file that ends in .txt
  const firstRoleTxt = dirents
    .filter(d => d.isFile() && d.name.toLowerCase().endsWith(".txt"))
    .map(d => d.name)[0];

  const roleText = firstRoleTxt
    ? await readAsset(`roles/${firstRoleTxt}`)
    : "You are an empathetic guide for autism supporters.";

  /* ---------- 3. Assemble the system prompt ---------- */
  const systemContent = [roleText, legal].join("\n\n");

  /* ---------- 4. Assistant primer message ---------- */
  const assistantPrimer =
    "Hello! I’m here to help supporters of autism families. How can I assist?";

  /* ---------- 5. Return messages array ---------- */
  return [
    { role: "system", content: systemContent },
    ...opts.history,
    { role: "assistant", content: assistantPrimer },
    { role: "user", content: opts.userMessage }
  ] satisfies ChatCompletionMessageParam[];
}
