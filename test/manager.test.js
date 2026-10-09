'use strict';
const { test, before, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
let auth, Registry, AuthErrorCode, saved, current, initCount, init, getCurrent;
const result = {
  user: { uid: 'google-user' },
  credential: {
    providerId: 'google.com',
    signInMethod: 'google.com',
    idToken: 'id-secret',
    accessToken: 'access-secret',
    refreshToken: 'refresh-secret',
    serverAuthCode: 'code-secret',
  },
};
before(async () => {
  ({ auth, ProviderRegistry: Registry } =
    await import('../dist/esm/core/index.js'));
  ({ AuthErrorCode } = await import('../dist/esm/index.js'));
});
beforeEach(() => {
  saved = new Map();
  current = null;
  initCount = 0;
  init = async () => {};
  getCurrent = async () => current;
  Registry.clearAll();
  Registry.registerLoader('google', async () => ({
    default: class {
      async initialize() {
        initCount++;
        await init();
      }
      async signIn() {
        current = result.user;
        return result;
      }
      async signOut() {
        current = null;
      }
      async getCurrentUser() {
        return getCurrent();
      }
      dispose() {}
    },
  }));
  auth.configure({
    providers: { google: { clientId: 'test' } },
    storage: {
      get: async (k) => saved.get(k) ?? null,
      set: async (k, v) => saved.set(k, v),
      remove: async (k) => saved.delete(k),
      clear: async () => saved.clear(),
    },
  });
});
afterEach(async () => {
  if (auth.isAuthenticated()) await auth.signOut();
  auth.dispose();
});
test('manager does not persist secret credential fields', async () => {
  await auth.signIn('google');
  assert.equal(auth.isAuthenticated(), true);
  const snapshot = JSON.stringify([...saved.values()]);
  for (const token of [
    'id-secret',
    'access-secret',
    'refresh-secret',
    'code-secret',
  ])
    assert.ok(!snapshot.includes(token));
  await auth.signOut();
  assert.equal(auth.isAuthenticated(), false);
  assert.equal(saved.size, 0);
});
test('simultaneous provider loads initialize once', async () => {
  const [a, b] = await Promise.all([
    Registry.getProvider('google', {}),
    Registry.getProvider('google', {}),
  ]);
  assert.equal(a, b);
  assert.equal(initCount, 1);
});
test('failed provider initialization can be retried', async () => {
  init = async () => {
    throw new Error('unavailable');
  };
  await assert.rejects(Registry.getProvider('google', {}));
  init = async () => {};
  await Registry.getProvider('google', {});
  assert.equal(initCount, 2);
});
test('clearing during initialization never caches the abandoned provider', async () => {
  let release;
  init = () =>
    new Promise((r) => {
      release = r;
    });
  const pending = Registry.getProvider('google', {});
  while (!release) await Promise.resolve();
  Registry.clearAll();
  release();
  await assert.rejects(pending, { code: AuthErrorCode.OPERATION_NOT_ALLOWED });
  init = async () => {};
  await Registry.getProvider('google', {});
  assert.equal(initCount, 2);
});
test('supported providers exclude disabled roadmap providers', async () => {
  assert.deepEqual(await Registry.getSupportedProviders(), ['google']);
});
test('disabled provider has its documented error', async () => {
  await assert.rejects(Registry.getProvider('apple', {}), {
    code: AuthErrorCode.PROVIDER_NOT_ENABLED,
  });
});
test('late restore cannot authenticate after sign-out', async () => {
  await auth.signIn('google');
  let release;
  getCurrent = () =>
    new Promise((r) => {
      release = r;
    });
  auth.configure({ providers: { google: { clientId: 'test' } } });
  while (!release) await Promise.resolve();
  await auth.signOut();
  release(result.user);
  await new Promise((r) => setImmediate(r));
  assert.equal(auth.isAuthenticated(), false);
});

test('prepare initializes without signing in', async () => {
  await auth.prepare('google');
  assert.equal(initCount, 1);
  assert.equal(auth.isAuthenticated(), false);
});
