"use client";
import { useState, useRef } from "react";

type Role = "user" | "assistant";
type Msg  = { role: Role; content: string };

export default function SupporterChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Send the user’s message to the backend and display the AI response */
  async function send() {
    const text = inputRef.current!.value.trim();
    if (!text) return;                              // ignore empty submits
    inputRef.current!.value = "";                   // clear box immediately

    // 1️⃣ add user message to the chat window
    setMessages(m => [...m, { role: "user", content: text }]);

    // 2️⃣ call our /api/chat route (non-streaming JSON)
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history: messages })
    });
    const data = await res.json();                  // { answer: string }

    // 3️⃣ add assistant reply
    setMessages(m => [...m, { role: "assistant", content: data.answer }]);
  }

  return (
    <main className="flex flex-col max-w-xl mx-auto p-4 h-screen">
      {/* message list */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "text-right" : "text-left"}
          >
            <div
              className={`inline-block px-3 py-2 rounded-2xl ${
                m.role === "user" ? "bg-blue-200" : "bg-gray-200"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
      </div>

      {/* input box */}
      <input
        ref={inputRef}
        placeholder="Type your question…"
        className="border rounded-xl p-3 mt-3"
        onKeyDown={e => e.key === "Enter" && send()}
      />
    </main>
  );
}
