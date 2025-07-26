// Force Node runtime so we can use JSON imports without Edge limits
export const runtime = 'nodejs';

import type { ChatRequestBody, ChatResponse } from './types';
import type { RouteConfig }      from './types';

// JSON imports – these are written by compile-assets.ts at build time
import router      from '@/lib/generated/router.json';
import toneMap     from '@/lib/generated/tones.json';
import fallbackMap from '@/lib/generated/fallbacks.json';

function selectRoute(body: ChatRequestBody): RouteConfig {
  const direct = (router as RouteConfig[]).find(r =>
    r.id.startsWith(body.user_role || '')
  );
  return direct ?? (router as RouteConfig[])[0];
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
