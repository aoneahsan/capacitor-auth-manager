'use strict';
const { writeFileSync } = require('node:fs');
// Give the unbundled ESM output an explicit format without changing the root CommonJS CLI.
writeFileSync(
  'dist/esm/package.json',
  JSON.stringify({ type: 'module' }) + '\n'
);
