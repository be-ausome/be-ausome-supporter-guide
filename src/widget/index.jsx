import React from 'react';
import { createRoot } from 'react-dom/client';
import SupporterChatWidget from './SupporterChatWidget.jsx';

const container = document.getElementById('supporter-chat-root');
if (container) {
  const root = createRoot(container);
  root.render(<SupporterChatWidget />);
}
