# Motion common mistakes

What each recurring motion mistake causes and what to do instead.

| Mistake | What happens | Instead |
|---|---|---|
| Per-module easing values | app feels assembled | the shared token set |
| Reduced motion = everything off | user loses all feedback | neutralise movement, keep opacity |
| Animating `height` for an accordion | jank every frame | `grid-template-rows` or `scaleY` |
| A library for a hover | ~30 KB for two lines of CSS | CSS |
| Staggering a long list | reads as slow | stagger heroes only |
| `scale` on an element positioned by `transform` | `scale` applies on top of `transform`, so the move is scaled too and the element leaves its place (a former cursor ring jumped to 1.5× the pointer's distance from the corner) | position the outer element; scale an inner layer (a pseudo-element) about its own centre |
| Reading restraint as "product UI must not move" | a page that is correct and **dead** | the responsiveness floor above |
