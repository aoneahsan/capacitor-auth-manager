# Dates, numbers, RTL and lazy namespaces

The formatting, right-to-left and catalogue-loading detail behind the i18n body.

## Dates and numbers

Use `Intl`, not hand-written formats. `date-fns` for arithmetic; `Intl.DateTimeFormat` for display.

Two traps worth stating: a date rendered without a timezone lands on the wrong day for users near the
boundary (see the daily-log tests in `aoneahsan-cccs-unit-testing`), and a hardcoded `MM/DD/YYYY` is
unreadable to most of the world.

## RTL, kept correct without shipping it

Costless now, expensive later:

- **Logical CSS properties** — `margin-inline-start`, not `margin-left`; `text-align: start`, not `left`.
- **`dir` on `<html>`**, driven by the locale.
- Never assume an icon's direction — a back arrow flips in RTL.

Tailwind's logical utilities (`ms-4`, `pe-2`, `text-start`) make this a habit rather than a project.

## Lazy namespaces

Load `common` at boot and each feature namespace with its route. A single bundle holding every string for
every locale is a real cost the moment a second locale exists.
