export interface ChatRequestBody {
  message: string;
  user_role?: string;
}

export interface ChatResponse {
  reply?: { content: string };
  error?: string;
}

export interface RouteConfig {
  id: string;                 // e.g. "neighbor_default"
  systemPrompt: string;       // path into original asset tree (kept here for reference)
  tone: string;               // tone key
  fallbackId: string;         // 🔸 maps to key in generated fallbacks.json
  roleSnippet?: string;
}
