import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message, user_role } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Missing message in body' });
  }

  // TEMP FAKE RESPONSE — replace with OpenAI call
  res.status(200).json({
    reply: { content: `Echo: ${message} (role: ${user_role})` }
  });
}
