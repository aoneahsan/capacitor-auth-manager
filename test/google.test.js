'use strict';
const { test, before, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
let Google, AuthErrorCode, WebStorage, Logger, AuthProvider;
let callback, prompt, popup, tokenConfig, provider, saved;
const claims = (extra = {}) => ({
  iss: 'https://accounts.google.com',
  aud: 'test-client',
  sub: 'google-user',
  exp: Date.now() / 1000 + 3600,
  email: 'test@example.com',
  ...extra,
});
const jwt = (payload) =>
  `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
before(async () => {
  ({ GoogleAuthProviderWeb: Google } =
    await import('../dist/esm/providers/web/index.js'));
  ({ AuthErrorCode, WebStorage, Logger, AuthProvider } =
    await import('../dist/esm/index.js'));
});
beforeEach(() => {
  saved = new Map();
  prompt = () => {};
  popup = () => {};
  global.window = {
    google: {
      accounts: {
        id: {
          initialize: (c) => {
            callback = c.callback;
          },
          prompt: (notify) => prompt(notify),
          cancel() {},
          disableAutoSelect() {},
        },
        oauth2: {
          initTokenClient: (c) => {
            tokenConfig = c;
            return { requestAccessToken: () => popup(c) };
          },
        },
      },
    },
  };
  provider = new Google({
    provider: AuthProvider.GOOGLE,
    options: { clientId: 'test-client', webFlow: 'one-tap' },
    storage: {
      get: async (k) => saved.get(k) ?? null,
      set: async (k, v) => saved.set(k, v),
      remove: async (k) => saved.delete(k),
      clear: async () => saved.clear(),
    },
    logger: new Logger({ enableLogging: false, logLevel: 'silent' }),
  });
});
afterEach(() => {
  provider.dispose();
  delete global.window;
});
function deliver(payload) {
  prompt = () => {
    void callback({ credential: jwt(payload) });
  };
}
test('One-Tap returns an ID credential and persists only the profile', async () => {
  deliver(claims());
  const r = await provider.signIn();
  assert.equal(r.user.uid, 'google-user');
  assert.ok(r.credential.idToken);
  assert.equal(r.credential.accessToken, undefined);
  assert.ok(
    !JSON.stringify([...saved.values()]).includes(r.credential.idToken)
  );
});
for (const [name, extra, code] of [
  ['issuer', { iss: 'evil.example' }, 'INVALID_TOKEN'],
  ['audience', { aud: 'other' }, 'INVALID_TOKEN'],
  ['expired', { exp: 1 }, 'TOKEN_EXPIRED'],
  ['missing expiry', { exp: undefined }, 'INVALID_TOKEN'],
  ['missing subject', { sub: undefined }, 'INVALID_TOKEN'],
])
  test(`One-Tap rejects ${name}`, async () => {
    deliver(claims(extra));
    await assert.rejects(provider.signIn(), { code: AuthErrorCode[code] });
    assert.equal(saved.size, 0);
  });
test('requested nonce rejects both mismatch and absence', async () => {
  provider.options.nonce = 'nonce';
  for (const nonce of [undefined, 'wrong']) {
    deliver(claims({ nonce }));
    await assert.rejects(provider.signIn(), {
      code: AuthErrorCode.INVALID_NONCE,
    });
  }
  deliver(claims({ nonce: 'nonce' }));
  assert.ok((await provider.signIn()).credential.idToken);
});
test('ID token enforces configured Workspace domain', async () => {
  provider.options.hostedDomain = 'company.example';
  deliver(claims());
  await assert.rejects(provider.signIn(), {
    code: AuthErrorCode.INVALID_TOKEN,
  });
});
test('cancellation settles the request and permits a retry', async () => {
  prompt = (n) =>
    n({
      isDismissedMoment: () => true,
      getDismissedReason: () => 'cancel_called',
    });
  await assert.rejects(provider.signIn(), {
    code: AuthErrorCode.USER_CANCELLED,
  });
  deliver(claims());
  assert.ok((await provider.signIn()).credential.idToken);
});
test('overlapping direct calls reject instead of abandoning the first promise', async () => {
  await provider.initialize();
  const first = provider.signIn();
  await assert.rejects(provider.signIn(), {
    code: AuthErrorCode.OPERATION_NOT_ALLOWED,
  });
  await callback({ credential: jwt(claims()) });
  await first;
});
test('dispose cancels an outstanding One-Tap request', async () => {
  await provider.initialize();
  const result = provider.signIn();
  provider.dispose();
  await assert.rejects(result, { code: AuthErrorCode.USER_CANCELLED });
});
test('popup access token fetches Google profile and cannot be mistaken for an ID token', async (t) => {
  t.mock.method(global, 'fetch', async () => ({
    ok: true,
    json: async () => claims(),
  }));
  popup = (c) =>
    c.callback({ access_token: 'access-secret', expires_in: 3600 });
  const result = await provider.signIn({ options: { webFlow: 'popup' } });
  assert.equal(result.credential.accessToken, 'access-secret');
  assert.equal(result.credential.idToken, undefined);
  await assert.rejects(provider.getIdToken(), {
    code: AuthErrorCode.NO_AUTH_SESSION,
  });
  assert.ok(!JSON.stringify([...saved.values()]).includes('access-secret'));
});
for (const [type, code] of [
  ['popup_closed', 'POPUP_CLOSED_BY_USER'],
  ['popup_failed_to_open', 'POPUP_BLOCKED'],
]) {
  test(`popup maps ${type}`, async () => {
    popup = (c) => c.error_callback({ type });
    await assert.rejects(provider.signIn({ options: { webFlow: 'popup' } }), {
      code: AuthErrorCode[code],
    });
  });
}
test('auto falls back to popup when One-Tap is suppressed', async (t) => {
  t.mock.method(global, 'fetch', async () => ({
    ok: true,
    json: async () => claims(),
  }));
  prompt = (n) =>
    n({
      isNotDisplayed: () => true,
      getNotDisplayedReason: () => 'suppressed',
    });
  popup = (c) => c.callback({ access_token: 'token' });
  assert.equal(
    (await provider.signIn({ options: { webFlow: 'auto' } })).credential
      .accessToken,
    'token'
  );
});
test('userinfo without a Google subject is rejected', async (t) => {
  t.mock.method(global, 'fetch', async () => ({
    ok: true,
    json: async () => ({ email: 'user@example.com' }),
  }));
  popup = (c) => c.callback({ access_token: 'token' });
  await assert.rejects(provider.signIn({ options: { webFlow: 'popup' } }), {
    code: AuthErrorCode.INVALID_TOKEN,
  });
});
test('denied browser storage uses memory', async () => {
  Object.defineProperty(window, 'localStorage', {
    get() {
      throw new Error('denied');
    },
  });
  const storage = new WebStorage();
  await storage.set('sample', { value: 1 });
  assert.deepEqual(await storage.get('sample'), { value: 1 });
});

for (const action of ['dispose', 'signOut']) {
  test(`${action} settles an outstanding popup and ignores late callbacks`, async () => {
    await provider.initialize();
    const result = provider.signIn({ options: { webFlow: 'popup' } });
    await new Promise((resolve) => setImmediate(resolve));
    const rejection = assert.rejects(result, {
      code: AuthErrorCode.USER_CANCELLED,
    });
    await provider[action]();
    await rejection;
    tokenConfig.callback({ access_token: 'late-token' });
    assert.equal(saved.size, 0);
  });
}
for (const credential of ['header.!.signature', jwt(null), jwt([])]) {
  test(`malformed token is an INVALID_TOKEN error: ${credential}`, async () => {
    prompt = () => {
      void callback({ credential });
    };
    await assert.rejects(provider.signIn(), {
      code: AuthErrorCode.INVALID_TOKEN,
    });
  });
}
