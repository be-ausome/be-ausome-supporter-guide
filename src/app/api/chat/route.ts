// src/app/api/chat/route.ts
import OpenAI from "openai";
import { buildMessages } from "@/lib/generatePrompt";

// 🟢 1) delete the line: export const runtime = "edge";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  const { message, history = [] } = await req.json();

  const messages = await buildMessages({ userMessage: message, history });

  // 🟢 2) Call OpenAI without streaming
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    messages
  });

  // 🟢 3) Return plain JSON text
  return Response.json({ answer: completion.choices[0].message.content });
}
