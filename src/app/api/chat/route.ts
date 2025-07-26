import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const SYSTEM_PROMPT = readFileSync(
  path.join(process.cwd(), 'src', 'lib', 'assets', 'supporter_system_prompt.txt'),
  'utf8'
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { message = '', history = [] } = await req.json();

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.7,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: message }
    ]
  });

  return NextResponse.json({
    answer: completion.choices[0].message.content
  });
}

export function GET() {
  return NextResponse.json(
    { error: 'Use POST with JSON {message,history}' },
    { status: 405 }
  );
}
