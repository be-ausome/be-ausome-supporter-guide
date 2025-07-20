// scripts/build-widget.js
import { rmSync, existsSync } from 'fs';
import { build } from 'esbuild';

// Clean up any previous bundle
const outFile = 'public/widget.js';
if (existsSync(outFile)) {
  rmSync(outFile);
}

// Build the new widget bundle
build({
  entryPoints: ['src/widget/index.jsx'],
  bundle: true,
  minify: true,
  outfile: outFile,
  loader: { '.jsx': 'jsx' },
})
  .then(() => {
    console.log('✅ Widget built to', outFile);
  })
  .catch((err) => {
    console.error('❌ Build failed:', err);
    process.exit(1);
  });
