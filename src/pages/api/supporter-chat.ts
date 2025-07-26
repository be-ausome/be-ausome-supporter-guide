import type { NextApiRequest, NextApiResponse } from 'next';
import { getReply } from '@/lib/core/chat-engine';
import type { ChatRequestBody, ChatResponse } from '@/lib/core/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse>
) {
  /* ---------- CORS ---------- */
  res.setHeader('Access-Control-Allow-Origin', 'https://be-ausome.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method Not Allowed' });

  const body = req.body as ChatRequestBody;

  if (!body.message?.trim()) {
    return res.status(400).json({ error: 'Missing message' });
  }

  const reply = await getReply(body);
  res.status(200).json(reply);
}
