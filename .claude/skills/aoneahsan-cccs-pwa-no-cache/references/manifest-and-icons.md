# Manifest, icons, iOS meta

## `public/manifest.webmanifest`

```json
{
  "id": "/",
  "name": "<Product full name>",
  "short_name": "<12 chars max>",
  "description": "<the product's one-line promise, from its Story Bible>",
  "start_url": "/?source=pwa",
  "scope": "/",
  "display": "standalone",
  "display_override": ["window-controls-overlay", "standalone"],
  "orientation": "any",
  "theme_color": "<token: brand surface>",
  "background_color": "<token: page background>",
  "categories": ["<productivity|health|…>"],
  "icons": [
    { "src": "/icons/pwa-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/pwa-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/pwa-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "screenshots": [
    { "src": "/pwa/screen-wide.png", "sizes": "1440x900", "type": "image/png", "form_factor": "wide", "label": "<what it shows>" },
    { "src": "/pwa/screen-narrow.png", "sizes": "390x844", "type": "image/png", "form_factor": "narrow", "label": "<what it shows>" }
  ]
}
```

- `id` and `start_url` never change after launch: a changed `id` makes installed copies a different app.
- `start_url` must be inside `scope` and must answer 200 from the SPA fallback. `?source=pwa` lets analytics tell
  installed sessions apart (register the dimension in the event registry, `aoneahsan-cccs-analytics`).
- Colours come from the project's tokens, not a guess; `theme_color` also goes in `<meta name="theme-color">`
  (light and dark variants with `media`).
- `shortcuts` only for real top tasks (2–4), each with a 96px icon.
- A product that already has an `apple-touch-icon` or OG art reuses the same SVG master.

## Icons (SVG master → PNG, no script files)

```bash
rsvg-convert -w 192 -h 192 brand/mark.svg -o public/icons/pwa-192.png
rsvg-convert -w 512 -h 512 brand/mark.svg -o public/icons/pwa-512.png
# maskable: the mark inside the 80% safe zone on a full-bleed background
rsvg-convert -w 512 -h 512 brand/mark-maskable.svg -o public/icons/pwa-maskable-512.png
rsvg-convert -w 180 -h 180 brand/mark-maskable.svg -o public/apple-touch-icon.png
```

The maskable master is its own SVG (mark at ≤80% of the canvas, solid background). Check it at maskable.app's
circle and squircle crops or by eye at 48px. Keep the SVG masters committed (`always-save-svg-and-png`).

## Screenshots

Real, fresh, non-admin captures of the live app (no PII) at 1440×900 and 390×844, from the automation browser.
Refresh them when the home screen changes.

## `index.html` head

```html
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#…" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#…" media="(prefers-color-scheme: dark)" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="<short_name>" />
```

Prerendered pages (postbuild SEO HTML) need the same head lines: every entry HTML, not just `index.html`.
Remove any second manifest (`manifest.json`, `site.webmanifest`) and every link to it — one manifest per origin.
