// esbuild.config.js
// This config produces an ES module build with code splitting for vendor + app.
import { build } from 'esbuild';

build({
  entryPoints: ['src/widget/index.jsx'],
  bundle: true,
  minify: true,
  splitting: true,
  format: 'esm',
  outdir: 'public/build',
  loader: { '.jsx': 'jsx' },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  sourcemap: false,
}).catch(() => process.exit(1));

// package.json (partial)
{
  "scripts": {
    "build:widget": "node esbuild.config.js"
  },
  "devDependencies": {
    "esbuild": "^0.18.10"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}

// src/widget/index.jsx (entry)
import React from 'react';
import { createRoot } from 'react-dom/client';
import SupporterChatWidget from './SupporterChatWidget.jsx';

// Mount into the page
const container = document.getElementById('supporter-chat-root');
if (container) {
  const root = createRoot(container);
  root.render(<SupporterChatWidget />);
}

// Theme snippet (use type="module" to load ES modules)

/* In your page.chat.liquid, replace the script tag with: */

<div id="supporter-chat-root"></div>
<script type="module" defer>
  import 'https://esm.sh/react@18.3.1';
  import 'https://esm.sh/react-dom@18.3.1/client';
  import '/buildersupporter-app.vercel.app/build/index.js';
</script>
<style>
  #supporter-chat-root { position: fixed; bottom: 20px; right: 20px; }
</style>
