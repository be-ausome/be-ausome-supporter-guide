export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // <-- pull the entire array of role/content pairs
  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'No messages provided' });
  }

  // <-- make sure your env var is set
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Missing OPENAI_API_KEY');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // or gpt-3.5-turbo if you prefer
        messages,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('OpenAI error', data);
      return res.status(response.status).json({ error: data.error?.message || 'OpenAI error' });
    }

    // return the assistant’s full message object
    const reply = data.choices[0].message;
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Fetch to OpenAI failed', err);
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
