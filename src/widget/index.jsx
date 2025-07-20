// src/index.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import SupporterChatWidget from './SupporterChatWidget.jsx';

console.log('[SupporterChatWidget] index.jsx loaded');

const container = document.getElementById('supporter-chat-root');
if (container) {
  const root = createRoot(container);
  root.render(<SupporterChatWidget />);
}
