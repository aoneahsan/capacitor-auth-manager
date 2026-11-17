# OneSignal common mistakes

What each recurring push mistake causes and what to do instead. Read before reviewing a push integration.

| Mistake | What happens | Instead |
|---|---|---|
| Hand-rolled VAPID | registers subscriptions it can never send to | OneSignal |
| Asking for the REST API key | a blocked wave over a key we never use | subscribe; he broadcasts from the dashboard |
| Push for a daily reminder | a backend for a device preference | `@capacitor/local-notifications` |
| Adding `google-services.json` for OneSignal | a file request the owner cannot action usefully | nothing — the SDK does not read it |
| Asking him to enable localhost | a question already answered, permanently | verify on the deployed origin |
| Reading only `Notification.permission` | "push is on" over an unsubscribed device | read the subscription state too |
| Reading setup state off a doc | stale in both directions | the two curl probes above |
| Prompting at launch | denied, and effectively permanently | opt-in behind context |
| Worker at scope `/` beside a PWA worker | one silently wins | subdirectory scope |
| Static import of both SDKs | the wrong one ships in each build | dynamic import per platform |
| Tap opens the home screen | the notification is wasted | route the deep link |
| `AD_ID` left in with the declaration saying no | Play Console error | keep all three in agreement |
