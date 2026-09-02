'use strict';

/**
 * Tarball smoke test — the gate ISSUE-001 / ISSUE-002 / ISSUE-003 / ISSUE-004 never had.
 *
 * A repo build cannot catch these: bundlers resolve extensionless specifiers and jsdom-style
 * environments hide `window` access. Only installing the packed tarball into a clean directory and
 * importing it under bare Node does. Runs with the built-in test runner:
 * `node --test test/tarball-smoke.test.js` (`yarn smoke:tarball`).
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const packageRoot = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';

/** Runs npm (a .cmd shim on Windows, so it needs a shell there). */
function npm(args, cwd) {
  return execFileSync(isWindows ? 'npm.cmd' : 'npm', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: isWindows,
  });
}

/** Runs a script file with the current Node binary — no shell, so nothing needs quoting. */
function node(scriptPath, cwd) {
  return execFileSync(process.execPath, [scriptPath], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

test('the packed tarball imports under bare Node (ESM + CJS) with no DOM', () => {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'cam-tarball-smoke-'));
  try {
    const packOutput = npm(['pack', '--pack-destination', scratch, '--silent'], packageRoot);
    const tarball = packOutput.trim().split(/\r?\n/).pop();
    assert.ok(tarball && tarball.endsWith('.tgz'), `npm pack produced no tarball: ${packOutput}`);

    fs.writeFileSync(
      path.join(scratch, 'package.json'),
      JSON.stringify({ name: 'cam-smoke', private: true, version: '0.0.0' })
    );
    npm(
      ['install', '--no-audit', '--no-fund', '--silent', '@capacitor/core', 'react', path.join(scratch, tarball)],
      scratch
    );

    const installed = fs.readdirSync(path.join(scratch, 'node_modules'));
    assert.ok(installed.includes('capacitor-auth-manager'));
    assert.ok(
      !installed.includes('capacitor-biometric-authentication'),
      'a disabled provider dependency must not be installed for every consumer (ISSUE-004)'
    );

    const cjsCheck = path.join(scratch, 'check.cjs');
    fs.writeFileSync(
      cjsCheck,
      [
        "const m = require('capacitor-auth-manager');",
        "const r = require('capacitor-auth-manager/react');",
        "console.log(typeof m.auth, typeof m.AuthProvider, typeof r.useAuth);",
      ].join('\n')
    );
    assert.equal(
      node(cjsCheck, scratch),
      'object object function',
      'CJS require must not touch window at import time (ISSUE-002)'
    );

    const esmCheck = path.join(scratch, 'check.mjs');
    fs.writeFileSync(
      esmCheck,
      [
        "const m = await import('capacitor-auth-manager');",
        "const c = await import('capacitor-auth-manager/core');",
        "const w = await import('capacitor-auth-manager/providers/web');",
        "console.log(typeof m.auth, typeof c.PlatformDetector, typeof w.GoogleAuthProviderWeb);",
      ].join('\n')
    );
    assert.equal(
      node(esmCheck, scratch),
      'object function function',
      'ESM import must resolve every relative specifier (ISSUE-001)'
    );
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
});
