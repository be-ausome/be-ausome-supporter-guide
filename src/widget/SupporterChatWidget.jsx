/**
 * SupporterChatWidget.jsx
 *
 * A minimal React chat widget to integrate with your Shopify storefront.
 * Usage:
 * 1. Copy this file into your front-end project or Shopify app bundle.
 * 2. Import and render <SupporterChatWidget /> in a theme app extension, app proxy page, or custom storefront page.
 * 3. Ensure your `/api/supporter-gpt` endpoint is reachable (use Shopify App Proxy to route requests).
 */

import React, { useState, useEffect, useRef } from 'react';

export default function SupporterChatWidget() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! How can I help you support an autism family today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/supporter-gpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: input, user_role: 'supporter' })
      });
      const data = await response.json();

      // Extract the first available output field
      const outputValues = Object.values(data.output || {});
      const botContent = outputValues.length ? outputValues[0] : 'Sorry, I didn\'t get that.';

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: botContent, tone: data.tone, scriptId: data.script_id }
      ]);
    } catch (error) {
      console.error('Error calling API:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Oops—something went wrong. Please try again.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-2xl shadow-lg">
      <div className="h-64 overflow-y-auto mb-4 space-y-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`inline-block p-2 rounded-xl ${msg.role === 'assistant' ? 'bg-gray-100' : 'bg-blue-500 text-white'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex border rounded-lg overflow-hidden">
        <input
          className="flex-1 px-3 py-2 focus:outline-none"
          placeholder="Type your message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          disabled={loading}
        />
        <button
          className="px-4 py-2 font-semibold"
          onClick={sendMessage}
          disabled={loading}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
