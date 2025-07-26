import { ChatRequestBody, ChatResponse } from './types';
import { readText, readJSON, mergeTone } from './utils';
import type { RouteConfig } from './types';

const router: RouteConfig[] = readJSON<RouteConfig[]>('routing/router.json');
const toneMap           = readJSON<Record<string, any>>('tones/default.json');

/** Choose route based on user_role or keyword heuristics */
function selectRoute(body: ChatRequestBody): RouteConfig {
  // 1️⃣ exact role match
  const match = router.find(r => r.id.startsWith(body.user_role || ''));
  if (match) return match;

  // 2️⃣ fallback to first route in file
  return router[0];
}

export async function getReply(body: ChatRequestBody): Promise<ChatResponse> {
  const route = selectRoute(body);

  /* ---------- Build final system prompt ---------- */
  const systemPrompt = [
    readText(route.systemPrompt),
    route.roleSnippet ? readText(route.roleSnippet) : '',
    /* compliance snippets can be appended here if needed */
  ].join('\n\n').trim();

  /* ---------- Tone ---------- */
  const toneBase      = toneMap['default'] || {};
  const toneOverride  = toneMap[route.tone] || {};
  const toneProfile   = mergeTone(toneBase, toneOverride);

  /* ---------- Compose messages array ---------- */
  const messages = [
    { role: 'system', content: `${systemPrompt}\n\n${toneProfile.prefix || ''}` },
    { role: 'user',   content: body.message }
  ];

  /* ---------- Call OpenAI ---------- */
  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization : `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model       : 'gpt-4o',
        messages,
        temperature : toneProfile.temperature ?? 0.7,
        max_tokens  : toneProfile.max_tokens ?? 400
      })
    });

    const json = await openaiRes.json();

    if (json.error) {
      throw new Error(json.error.message);
    }
    const reply = json?.choices?.[0]?.message?.content;
    if (!reply) throw new Error('No reply');

    /* post-processing hook */
    return { reply: { content: reply.trim() } };
  } catch (err) {
    const fb = readText(route.fallback);
    return { reply: { content: fb } };
  }
}
