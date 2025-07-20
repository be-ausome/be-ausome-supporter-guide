import { build } from 'esbuild';

async function main() {
  try {
    await build({
      entryPoints: ['src/widget/index.jsx'],
      bundle: true,
      minify: true,
      outfile: 'public/widget.js',
      loader: { '.jsx': 'jsx' },
      platform: 'browser',
    });
    console.log('✅ widget.js built');
  } catch (err) {
    console.error('❌ build failed:', err);
    process.exit(1);
  }
}

main();
