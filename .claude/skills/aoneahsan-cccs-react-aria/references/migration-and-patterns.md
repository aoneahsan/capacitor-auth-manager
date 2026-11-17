# Radix → RAC, the wrapper pattern, and instrumentation

Depth behind `SKILL.md`. Read when replacing a component library, or when writing the first few primitives.

## The Radix → RAC map

LifeWell deletes 15 `@radix-ui/*` packages. Every other project on Radix maps the same way.

| Radix package | RAC replacement | Note |
|---|---|---|
| `react-accordion` | `Disclosure` + `DisclosureGroup` | |
| `react-alert-dialog` | `Modal` + `Dialog` with `role="alertdialog"` | |
| `react-dialog` | `Modal` + `Dialog` | `DialogTrigger` wraps the trigger |
| `react-dropdown-menu` | `MenuTrigger` + `Menu` + `MenuItem` | |
| `react-popover` | `DialogTrigger` + `Popover` | |
| `react-select` | `Select` | `ComboBox` when it must be typeable |
| `react-checkbox` | `Checkbox` / `CheckboxGroup` | |
| `react-radio-group` | `RadioGroup` + `Radio` | |
| `react-tabs` | `Tabs` / `TabList` / `Tab` / `TabPanel` | |
| `react-toast` | `Toast` + `ToastRegion` | |
| `react-label` | `Label` | inside a field context |
| `react-separator` | `Separator` | |
| `react-scroll-area` | ❌ none | CSS `overflow` + styled scrollbars |
| `react-avatar` | ❌ none | presentational — build it |
| `@radix-ui/themes` | ❌ **delete entirely** | this is the visual layer we own |

**⚠️ A page index is not a component index.** `Dialog`, `MenuTrigger`, `FieldError` and `ToastRegion` are
real and load-bearing but have **no page of their own** in `llms.txt` — they are documented inside their
parent's page. Read the parent before concluding something is missing.

### Migration order that avoids a broken middle

1. Install RAC, add `@plugin "tailwindcss-react-aria-components";`, leave Radix in place.
2. Port **one leaf primitive** end to end (Button is ideal — no children, no state machine) and get its
   variants, tokens and instrumentation right. That primitive becomes the template.
3. Port the rest **leaf-first**: Checkbox, Radio, Switch, Separator, Label → fields → overlays → collections.
   Overlays last, because they are where a half-migrated tree shows the most.
4. Remove each `@radix-ui/*` package **as its last consumer disappears**, not in a final sweep — a lingering
   import is otherwise invisible until the build.
5. Delete `@radix-ui/themes` last, along with its theme provider and CSS import.

## The wrapper pattern

Never use a RAC component directly in a feature. Wrap it once, in the design system, so tokens,
variants and instrumentation are decided in one place.

```tsx
// src/components/ui/button.tsx
import {Button as RACButton, type ButtonProps as RACButtonProps} from 'react-aria-components';
import {cva, type VariantProps} from 'class-variance-authority';
import {twMerge} from 'tailwind-merge';

const button = cva(
  // base — focus ring uses a token, never a literal
  'inline-flex items-center justify-center gap-2 rounded-md font-medium ' +
  'transition-colors outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ' +
  'disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      tone: {
        primary: 'bg-accent text-text-inverse pressed:bg-accent-hover',
        ghost:   'bg-transparent text-text hovered:bg-surface-sunken',
        danger:  'bg-danger text-text-inverse pressed:brightness-90',
      },
      size: {sm: 'h-8 px-3 text-sm', md: 'h-10 px-4', lg: 'h-12 px-6 text-lg'},
    },
    defaultVariants: {tone: 'primary', size: 'md'},
  },
);

export interface ButtonProps
  extends RACButtonProps, VariantProps<typeof button> {
  /** Emits a click event to the analytics service. Omit only for noise. */
  analyticsId?: string;
}

export function Button({tone, size, className, analyticsId, onPress, ...props}: ButtonProps) {
  return (
    <RACButton
      {...props}
      // twMerge lets a caller override a base class without specificity games
      className={(renderProps) =>
        twMerge(button({tone, size}), typeof className === 'function' ? className(renderProps) : className)
      }
      onPress={(e) => {
        if (analyticsId) track('button_pressed', {id: analyticsId});
        onPress?.(e);
      }}
    />
  );
}
```

Three things to copy from this:

- **`cva` owns the variants**, so a variant is a prop rather than a class-name string a caller assembles.
- **`twMerge` makes overrides safe** — `className="bg-danger"` on a `primary` button wins, without `!important`.
  Note the render-prop branch: RAC's `className` may itself be a function, so a naive `twMerge(base, className)`
  would stringify it.
- **`pressed:` / `hovered:` come from the Tailwind plugin** — the `data-` prefix is stripped.

## Instrumentation belongs here, not in features

The reason "track every action" and "handle every error" quietly fail is that they are asked of *feature*
code, where every author must remember. Wire them into the primitive and a feature author gets both by using
the component:

- **`Button`, `Link`, form fields and `Form`** take `analyticsId` / `analyticsProps` and emit their own
  events. See `aoneahsan-cccs-analytics` for the naming taxonomy.
- **Route segments and async boundaries** carry error boundaries that report to the tracker and render the
  branded fallback.
- **Fire-and-forget instrumentation fails silently by design** — a green build proves nothing. Verify once,
  live, that the event actually arrives.

## `asChild` / polymorphism

RAC has no `asChild`. Where Radix used it to merge behaviour onto a caller's element, RAC's answer is
composition — most components accept the element you want, and `Link` exists for anchor semantics.

For a genuinely polymorphic wrapper, take an `as` prop and forward refs, rather than reaching for a
clone-element helper:

```tsx
// A Link that may render as a router Link, keeping RAC's press handling
<Link className={…} onPress={…}>
  <RouterLink to="/health">Health</RouterLink>
</Link>
```

## Testing RAC components

Adobe ships **`@react-aria/test-utils`** — ARIA *pattern testers* that simulate mouse, keyboard and touch and
query component state without a test needing to know which roles to target:

```ts
const user = new User({interactionType: 'keyboard', advanceTimer: vi.advanceTimersByTime});
const table = user.createTester('Table', {root: screen.getByTestId('metrics')});
await table.toggleSelectAll();
expect(table.getSelectedRows()).toHaveLength(10);
```

It works in jsdom. Drag, simulated scrolling and link-navigation assertions are **not** covered and stay
manual. See `aoneahsan-cccs-unit-testing` for what earns a test in the first place.

---

## Pitfalls — the six that stay out of `SKILL.md`

Added 2026-07-30 when `SKILL.md` exceeded the size budget. The four costliest stay there: a wrapper that does
not forward `errorMessage`, `href={undefined}`, "remove RAC because no component libraries", and reviewing a
primitive by reading the diff instead of rendering it.

| Mistake | What happens | Instead |
|---|---|---|
| RAC field in RHF without `validationBehavior="aria"` | two validators fight | set it, always |
| A label rendered as `<span>` instead of `<Label>` | identical pixels, anonymous control | a real `<Label>` child; `aria-label` if there is no visible one |
| An empty `<Label>` "to satisfy RAC" | silences the warning, name still empty — a loud bug made silent | render it only when a label exists |
| Hand-rolling a focus trap or roving tabindex | reinvents a solved problem, badly | use the RAC primitive |
| Concluding a component is missing from `llms.txt` | `Dialog`, `MenuTrigger`, `FieldError`, `ToastRegion` have no page of their own | read the parent page |
| Adding the Tailwind plugin to `tailwind.config.js` | no such file in v4 | `@plugin` in the CSS |
| Moving focus in a layout effect after a confirm dialog removes its own trigger (a Leave or Delete that takes the card with it) | the dialog's FocusScope restores focus to the gone trigger on the NEXT frame, which drops it to `<body>` after your hand-off ran (Rent Party's Leave the family, 2026-10-08) | hand the focus over one `requestAnimationFrame` later, and only if `document.activeElement` is still the body |

**The two label rows are one failure with two endings**, and the second is worse than the first. A `<span>`
leaves the control anonymous to a screen reader while looking perfect on screen. Reaching for an empty
`<Label>` to quiet the console then converts a *loud* bug into a *silent* one — the warning that would have
told the next developer is gone, and the accessible name is still empty. Render a label only when one exists;
otherwise give the control `aria-label`.

**The `llms.txt` row is a research trap, not a coding one.** Concluding a component "does not exist" because
it has no page of its own leads to hand-rolling a primitive RAC already ships. Check the parent page before
concluding anything is missing.

---

## The react-hook-form collision — the worked wiring

Moved out of `SKILL.md` 2026-07-30 (size budget). The rule stays there; this is the code and the incident.

```tsx
<Controller control={control} name="email"
  render={({field, fieldState: {invalid, error}}) => (
    <TextField {...field}
      validationBehavior="aria"          // ← turns RAC's own validation OFF
      isInvalid={invalid}
      errorMessage={error?.message}
    />
  )} />
```

Without `validationBehavior="aria"`, RAC runs **native HTML constraint validation** alongside RHF + Zod: two
validators fighting, browser-native bubbles beside styled errors, and submits blocked by rules no schema
contains. With it, RHF + Zod stays the single validation authority and RAC keeps supplying the ARIA wiring.

### Why the `errorMessage` corollary is the expensive half

Turning RAC's own validation off means the *only* remaining message source is the `errorMessage` prop. A wrapper
primitive that never forwards one leaves every field able to go invalid, turn red, and never say why — the Zod
message has nowhere to land.

Found on lifewell 2026-07-30, where **`Select`, `ComboBox`, `NumberField`, `CheckboxGroup` and `RadioGroup` had
no `errorMessage` prop at all** — five primitives, so every form in the app. It compiled, linted and built
clean, and was visible only by rendering an invalid state.

## Where the label defect was found (moved from SKILL.md)

Found on lifewell 2026-07-30 across four components (`Progress`, `MeterBar`, `MeterRing`, `ProgressRing`) —
every progress surface in the app.

## The four headline mistakes (moved from SKILL.md)

| Mistake | What happens | Instead |
|---|---|---|
| A field wrapper that does not forward `errorMessage` | the field goes invalid, turns red, and can never say why | forward `errorMessage` + `isInvalid`, always |
| `href={undefined}` on a RAC link | renders `href=""` — a real link to the current page; middle-click reloads | omit the **key**, not the value |
| "No component libraries, so remove RAC" | loses the a11y layer, keeps nothing | RAC is behaviour, not visual defaults |
| Building a primitive and reviewing only the code | **every defect in this class compiles and builds clean** | render every state — a gallery, not a diff |
