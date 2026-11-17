# Silent analytics failures and common mistakes

The three fleet-wide silent-analytics-death traps in full, and the mistakes table. Read when wiring a sink, writing an analytics test, or when events never reach a dashboard.

## 🔴 A hand-rolled gtag shim must push `arguments`, never a spread array

`function gtag(){dataLayer.push(arguments)}` and `function gtag(...args){dataLayer.push(args)}` **are not
equivalent.** gtag.js accepts an entry as a **command** only when it is an `arguments` object; a real `Array`
is ignored, so `config` never registers and **GA4 sends nothing** while gtag.js still downloads. Nothing
surfaces it — green build, no error, and `dataLayer` reads back as `['config','G-...']`. netcage-web
2026-08-30: **zero events for the site's whole life.**

**Check:** `dataLayer.push === Array.prototype.push` → **`true` means gtag.js never took over.** In a test,
assert the entry is `[object Arguments]` and keep the spread form as a negative control; asserting on the
payload passes either way. ⚠️ `send_page_view: false` hides it further — silence reads as a quiet site.
🔴 **A key blank in the DEPLOYED build lands nothing, whatever the vault holds** (Amplitude, same site,
same day).
🔴 **Flip a sink's "ready" flag on the init PROMISE, never on the init CALL.** `amplitude.init()` returns
before its destination plugins attach, and its `.promise` is easy to discard — every event in that window is
dropped with only *"no destination plugins on the instance"* in the console. Same site again, 2026-08-31,
and the only one of the three that is **intermittent**: 1 hit in 88 page loads. **So a clean run is not
evidence here — read the init code.**

## Common mistakes

### Clarity can restart after navigation

Clarity's own `pushState` wrapper can restart a stopped recording when the URL changes. If a route excludes replay, stop Clarity in the router's `onBeforeNavigate` and apply the route's recording decision again in `onResolved`. Check the signed-in and return routes after navigation, not only on the first page load (windowsweep, 2026-11-08).

| Mistake | What happens | Instead |
|---|---|---|
| Assuming a dispatched event landed | silent, for weeks | verify live in all three |
| Vendor SDK imported in a feature | three call sites per event, drift guaranteed | one service |
| Ad-hoc event names | dashboards untrustworthy by month three | the typed registry |
| Tracking per feature | half the app untracked | emit from the primitive |
| Identity not cleared on sign-out | sessions merge across users | clear on sign-out |
| Health values in properties | medical data in a third-party tool | the fact, never the value |
