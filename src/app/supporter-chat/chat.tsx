'use client';

import { useState, useRef } from 'react';

type Role = 'user' | 'assistant';
type Msg  = { role: Role; content: string };

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function send() {
    const text = inputRef.current!.value.trim();
    if (!text) return;
    inputRef.current!.value = '';

    setMessages(m => [...m, { role: 'user', content: text }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages })
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setMessages(m => [...m, { role: 'assistant', content: data.answer }]);
    } catch (err: any) {
      setMessages(m => [
        ...m,
        { role: 'assistant', content: `⚠️ ${err.message || 'Unknown error'}` }
      ]);
    }
  }

  return (
    <main className="flex flex-col max-w-xl mx-auto p-4 h-screen">
      <div className="flex-1 overflow-y-auto space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <div
              className={`inline-block px-3 py-2 rounded-2xl ${
                m.role === 'user' ? 'bg-blue-200' : 'bg-gray-200'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <input
        ref={inputRef}
        placeholder="Type your question…"
        className="border rounded-xl p-3 mt-3"
        onKeyDown={e => e.key === 'Enter' && send()}
      />
    </main>
  );
}
