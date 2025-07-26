export const runtime = 'nodejs';

import fs from 'fs';
import path from 'path';
import type { ChatRequestBody, ChatResponse, RouteConfig } from './types';

/*──────────────────────────────────────────────
  Load generated JSON bundle (always present)
──────────────────────────────────────────────*/
const GENERATED_ROOT = path.join(
  process.cwd(),              // /var/task in Lambda
  'src',
  'lib',
  'generated'
);

const router: any = JSON.parse(
  fs.readFileSync(path.join(GENERATED_ROOT, 'router.json'), 'utf8')
);
const toneMap: Record<string, any> = JSON.parse(
  fs.readFileSync(path.join(GENERATED_ROOT, 'tones.json'), 'utf8')
);
const fallbackMap: Record<string, string> = JSON.parse(
  fs.readFileSync(path.join(GENERATED_ROOT, 'fallbacks.json'), 'utf8')
);

/* ───── Adjusted for role-keyed router ───── */
function selectRoute(body: ChatRequestBody): RouteConfig {
  const role = body.user_role ?? (router as any).__fallback_role__ ?? 'neighbor';

  const roleArray: any[] | undefined = (router as any)[role];


  if (Array.isArray(roleArray) && roleArray.length) {
    const match = roleArray.find((r) =>
      r.keywords?.some((kw: string) =>
        body.message.toLowerCase().includes(kw.toLowerCase())
      )
    );
    const picked = match ?? roleArray[0];

    return {
      id: `${role}_${picked.script_id}`,
      tone: picked.tone_tags?.[0] ?? 'default',
      systemPrompt: (router as any).system_prompt,
      fallbackId: picked.script_id,
      roleSnippet: picked.delivery_format ?? undefined
    };
  }

  // Fallback if role missing
  return {
    id: `${role}_default`,
    tone: 'default',
    systemPrompt: (router as any).system_prompt,
    fallbackId: '__generic__'
  };
}


export async function getReply(body: ChatRequestBody): Promise<ChatResponse> {
  const route = selectRoute(body);

  /* 1️⃣  Build system prompt (already concatenated in router JSON) */
  const systemPrompt = route.systemPrompt;

  /* 2️⃣  Tone merge (default + route-specific) */
  const toneProfile = {
    ...(toneMap as Record<string, any>).default,
    ...(toneMap as Record<string, any>)[route.tone]
  };

  /* 3️⃣  Compose messages */
  const messages = [
    { role: 'system', content: `${systemPrompt}\n\n${toneProfile.prefix ?? ''}` },
    { role: 'user',   content: body.message }
  ];

  try {
    const rsp = await fetch('https://api.openai.com/v1/chat/completions', {
      method : 'POST',
      headers: {
        Authorization : `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model      : 'gpt-4o',
        messages,
        temperature: toneProfile.temperature ?? 0.7,
        max_tokens : toneProfile.max_tokens  ?? 400
      })
    });

    const data = await rsp.json();
    if (data?.error) throw new Error(data.error.message);
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) throw new Error('No reply from OpenAI');

    return { reply: { content: reply.trim() } };

  } catch {
    /* 4️⃣  Route-specific fallback text */
    const fb = (fallbackMap as Record<string, string>)[route.fallbackId] ??
               'Sorry—something went wrong.';
    return { reply: { content: fb } };
  }
}
