import { ChatRequestBody, ChatResponse } from './types';
import { readText, readJSON, mergeTone } from './utils';
import type { RouteConfig } from './types';

const router = readJSON<RouteConfig[]>('routing/router.json');
const toneMap = readJSON<Record<string, Record<string, unknown>>>('tones/default.json');

function selectRoute(body: ChatRequestBody): RouteConfig {
  return (
    router.find(r => r.id.startsWith(body.user_role || '')) ??
    router[0]
  );
}

export async function getReply(body: ChatRequestBody): Promise<ChatResponse> {
  const route = selectRoute(body);

  const systemPrompt = [
    readText(route.systemPrompt),
    route.roleSnippet ? readText(route.roleSnippet) : ''
  ]
    .join('\n\n')
    .trim();

  const toneProfile = mergeTone(
    toneMap['default'] ?? {},
    toneMap[route.tone] ?? {}
  );

  const messages = [
    { role: 'system', content: `${systemPrompt}\n\n${toneProfile.prefix ?? ''}` },
    { role: 'user', content: body.message }
  ];

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: toneProfile.temperature ?? 0.7,
        max_tokens: toneProfile.max_tokens ?? 400
      })
    });

    const data = await openaiRes.json();
    if (data?.error) throw new Error(data.error.message);
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) throw new Error('No reply from OpenAI');
    return { reply: { content: reply.trim() } };
  } catch {
    const fb = readText(route.fallback);
    return { reply: { content: fb } };
  }
}
