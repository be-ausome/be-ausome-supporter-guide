// File: /app/api/supporter-chat/route.ts

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, user_role } = body;

    if (!message) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }

    return NextResponse.json({
      reply: {
        content: `Echo: ${message} (role: ${user_role ?? 'unknown'})`
      }
    });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
