import { readFileSync } from 'node:fs';

const version = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const readme = read('../README.md');
const guide = read('../AI-INTEGRATION-GUIDE.md');

const checks = [
  ['README version row', readme.includes(`| **Version** | \`${version}\` |`)],
  ['README latest release', readme.includes(`Latest release: **\`${version}\`**`)],
  ['AI guide release', guide.includes(`Release: **${version}**.`)],
  ['AI guide install command', guide.includes(`yarn add capacitor-auth-manager@${version} `)],
];

const failed = checks.filter(([, passed]) => !passed).map(([label]) => label);
if (failed.length > 0) {
  process.stderr.write(`Release documentation does not match ${version}: ${failed.join(', ')}\n`);
  process.exitCode = 1;
}
