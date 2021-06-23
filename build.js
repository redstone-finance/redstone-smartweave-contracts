const { build } = require('esbuild');
const replace = require('replace-in-file');

const contracts = [
  '/providers-registry/providers-registry.contract.ts',
  '/contracts-registry/contracts-registry.contract.ts',
  '/token/token.contract.ts',
  '/examples/example-contract-1.ts',
];

build({
  entryPoints: contracts.map((source) => {
    return `./src${source}`;
  }),
  outdir: './dist',
  minify: false,
  bundle: true,
  format: "iife",
}).catch(() => process.exit(1))
  // note: SmartWeave SDK currently does not support files in IIFE bundle format, so we need to remove the "iife" part ;-)
  // update: it does since 0.4.31, but because viewblock.io is still incompatibile with this version, leaving as is for now.
  .finally(() => {
    const files = contracts.map((source) => {
      return `./dist${source}`.replace(".ts", ".js");
    });
    const results = replace.sync({
      files: files,
      from: [/\(\(\) => {/g, /}\)\(\);/g],
      to: "",
      countMatches: true
    });
  });
