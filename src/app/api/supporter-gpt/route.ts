import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { question = "", role = "ally" } = await req.json();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are the Be Ausome Supporter Guide…" },
      { role: "user",   name: role, content: question }
    ]
  });

  return NextResponse.json({
    answer: completion.choices[0].message.content
  });
}

// Optional: block GET to avoid 404 confusion
export function GET() {
  return NextResponse.json(
    { error: "Use POST with JSON {question, role}" },
    { status: 405 }
  );
}
