const { build } = require('esbuild');

build({
  entryPoints: [
    './src/providers-registry/providers-registry.contract.ts',
    './src/beacon/beacon.contract.ts'
  ],
  outdir: './dist',
  minify: false,
  bundle: false
}).catch(() => process.exit(1));