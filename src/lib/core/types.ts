export interface ChatRequestBody {
  message: string;
  user_role?: string;        // “neighbor”, “teacher”, etc.
}

export interface ChatResponse {
  reply?: { content: string };
  error?: string;
}

export interface RouteConfig {
  id: string;                        // e.g. "neighbor-default"
  systemPrompt: string;              // path to /assets/system/*.txt
  tone: string;                      // tone id in /assets/tones/*.json
  fallback: string;                  // path to /assets/fallbacks/*.txt
  roleSnippet?: string;              // optional path to /assets/roles/*.txt
}
