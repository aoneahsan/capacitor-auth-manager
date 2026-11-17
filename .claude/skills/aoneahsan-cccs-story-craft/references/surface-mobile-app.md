# Surface — mobile app (Capacitor / Android) and its store listing

Two audiences: the person deciding whether to install (the listing) and the person who just did (onboarding,
permissions, notifications). The listing is short and factual by rule; the app is where the voice lives.

## The store listing

- Title ≤ 30 characters, short description ≤ 80, 🔴 **full description ≤ 1,500 characters** (owner,
  2026-09-29; any store) of factual prose — only features every user reaches from the main screens, never
  admin- or plan-only ones; no keyword lists, no code blocks, no emojis in the title (`aoneahsan-cccs-copywriting`).
- Zero banned words: best, #1, top, leading, free, cutting-edge, user counts, testimonials, unverifiable
  legal or security claims, "AI-powered" when it is rule-based. Cross-check
  `~/.claude/policy/play-console-rejection-rules.json`.
- Structure: AIDA in four short paragraphs — the specific problem, what the app does about it, what a day
  with it looks like, the one honest limitation. Awareness level: usually problem-aware.
- Screenshot captions: ≤ 6 words each, one capability per caption, present tense.
- A mental-health app's listing never claims a clinical outcome (`safety.md`).

## Onboarding

Three screens at most, each one idea + one action. Screen 1 names the reader's situation in their words;
screen 2 shows the after-state (BAB); screen 3 is the first setup step. Skippable, and the skip is not
punished with a guilt line.

## Permission priming

Ask in context, at the moment the feature needs it, with the reason in one sentence and the consequence of
declining in the next ("Without location, the map centres on your last search instead"). Never on launch.
Notifications: the opt-in screen states how to turn them off and when they will fire; a scheduled reminder
is a local notification, not a push (`aoneahsan-cccs-reminders-notifications`); push subscription is
receive-only through OneSignal (`~/.claude/rules/push-notifications.md`).

## Notification copy

Title ≤ 40 characters, body ≤ 90; one fact, no exclamation marks; quiet hours honoured; a missed-day
notification never shames ("Yesterday had no entry. Today is open." — not "You broke your streak!").

## Offline and error states

Say what still works offline, in the state itself. A sync failure states what is safe locally. The
consequence shape in `safety.md` for anything lost.

## Review prompts

Ask once, after a real success, never after an error, never with a plea. One sentence, two honest buttons.

## Traps

- Permissions injected by plugins that the copy never mentions — the merged manifest is what the store
  reads (`aoneahsan-cccs-android-finalization`).
- Data Safety answers that contradict the in-app copy.
- The Android edge-to-edge inset eating the first line of onboarding (`~/.claude/rules/capacitor-plugins-and-issues.md`).

Related: `~/.claude/rules/publishing-compliance.md` · `~/.claude/rules/play-store-submission.md` ·
`aoneahsan-cccs-android-finalization`.
