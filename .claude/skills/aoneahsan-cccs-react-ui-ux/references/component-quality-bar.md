# The component quality bar — every dimension

The bar per dimension behind the skill body's 🔴 rows, and the skill holding each one's depth.

| Dimension | The bar |
|---|---|
| **States** | Every state it can enter is designed and reachable: default · hover · focus-visible · active · disabled · loading · error · empty · dense/overflowing. A component with only a default state is a mockup. |
| **Keyboard** | Fully operable with no mouse. Tab order follows visual order, `Escape` closes, `Enter`/`Space` activate, arrows move within a group. Focus is always **visible** — never `outline: none` without a replacement. *Built on a React Aria primitive, this is supplied — see `aoneahsan-cccs-react-aria`.* |
| **Screen reader** | An accessible name, the right role, and state announced (`aria-expanded`, `aria-selected`, `aria-invalid`, `aria-busy`). Icon-only controls carry `aria-label`. *RAC emits the state wiring; the **name** is still yours.* |
| **Contrast** | AA minimum: 4.5:1 for text, 3:1 for UI boundaries and focus rings — in **both** themes. Never encode meaning in colour alone; pair it with an icon, label or shape. *No library supplies this.* |
| **Motion** | Within the ≤600 ms budget, `transform`/`opacity` only, and fully neutralised under `prefers-reduced-motion` — per pattern, not a global off-switch. See `aoneahsan-cccs-motion`. |
| **Responsive** | Correct from 320 to 1920 with no horizontal scroll; touch targets ≥ 44px. See `aoneahsan-cccs-frontend-development`. |
| **Instrumentation** | Meaningful interactions emit an analytics event, and failures reach the error tracker — wired **once, in the primitive**, never re-decided per feature. Taxonomy: `aoneahsan-cccs-analytics`; boundaries: `-error-tracking`. |
| **Copy** | Real product voice in every state, including the ones nobody demos. |
| **Reuse** | It reads from design tokens, not literals. The same markup appearing twice means a component is missing. |
