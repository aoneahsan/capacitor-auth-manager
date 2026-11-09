'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const version = require(path.join(root, 'package.json')).version;
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const guide = fs.readFileSync(
  path.join(root, 'AI-INTEGRATION-GUIDE.md'),
  'utf8'
);

const required = [
  [readme, `| **Version** | \`${version}\` |`],
  [readme, `Latest release: **\`${version}\`**`],
  [guide, `Release: **${version}**.`],
  [guide, `yarn add capacitor-auth-manager@${version} `],
];

if (required.some(([text, marker]) => !text.includes(marker))) {
  process.stderr.write('Release documentation version mismatch\n');
  process.exitCode = 1;
}
