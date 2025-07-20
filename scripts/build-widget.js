// scripts/build-widget.js
import { build } from 'esbuild'
import { rmSync } from 'fs'
import path from 'path'

// delete the old bundle if it exists
const outFile = path.resolve(process.cwd(), 'public/widget.js')
rmSync(outFile, { force: true })

// bundle!
build({
  entryPoints: [path.resolve(process.cwd(), 'src/widget/index.jsx')],
  bundle: true,
  minify: true,
  outfile: outFile,
  loader: { '.jsx': 'jsx' },
}).catch(err => {
  console.error(err)
  process.exit(1)
})
