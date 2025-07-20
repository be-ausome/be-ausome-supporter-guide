// src/app/supporter-chat/page.tsx
export const dynamic = 'force-static';   // tells Next.js to emit a static HTML file

import Chat from './chat';               // ⬅️ lowercase “chat” matches chat.tsx

export default function SupporterChatPage() {
  return <Chat />;
}
