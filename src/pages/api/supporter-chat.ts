import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Missing message in request body' });
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4', // or 'gpt-3.5-turbo'
        messages: [
          {
            role: 'system',
            content:
              'You are a warm, grounded, autism-aware assistant helping friends and neighbors support autism families. Use helpful, plain language.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 400
      })
    });

    const data = await openaiRes.json();

    if (data.error) {
      console.error('OpenAI Error:', data.error);
      throw new Error(data.error.message || 'Unknown error from OpenAI');
    }

    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      console.error('OpenAI raw response (missing reply):', JSON.stringify(data, null, 2));
      throw new Error('No reply from OpenAI');
    }

    res.status(200).json({ reply: { content: reply } });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('GPT error:', err.message || err);
    res.status(500).json({ error: 'Something went wrong generating a response.' });
  }
}
