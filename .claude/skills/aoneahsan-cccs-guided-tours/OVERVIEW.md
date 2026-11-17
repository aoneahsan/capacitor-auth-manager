# Guided tours — overview

## Purpose

People need to know what a product gives them without being interrupted. The owner asked (2026-10-21) for two
demo systems in every web app, mobile app and extension product: a page tour started from one consistent
button, with a polite one-time hint, and a walkthrough page that explains the core of the product in a few
screens with real images. Both are drawn in the click dummy first.

## What this skill does

- Defines the page tour: the button, the once-per-page hint, skip, close and jump, desktop/responsive/phone step sets
- Defines the walkthrough page: steps with big screenshots, short bullets and calls to action, URL step state
- Fixes the library choice (Driver.js, MIT) behind our own wrapper, with a registry and seen-state persistence
- Sets i18n, accessibility, motion, analytics, performance and the parity test

## When it gets invoked

Adding onboarding, a product tour, a page tour, coachmarks, a "how it works" page or a demo; finalizing a
production project.

## References

- `references/implementation.md` — library comparison, wrapper layout, persistence, analytics, parity test, screenshots
