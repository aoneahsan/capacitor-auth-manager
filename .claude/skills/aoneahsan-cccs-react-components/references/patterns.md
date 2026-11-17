# Component patterns

## Primitive API shape

```tsx
interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  iconStart?: ReactNode;
}

export function Button({
  variant = 'primary', size = 'md', loading = false,
  iconStart, className, children, disabled, ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(base, VARIANTS[variant], SIZES[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner aria-hidden /> : iconStart}
      {children}
    </button>
  );
}
```

Four things earn their place here: extending the native props type (so `type`, `onClick`, `aria-*` all work
without being re-declared), `className` merged last so a caller can override, `disabled || loading` so a
loading button cannot be double-submitted, and `aria-busy` so the state is not purely visual.

## Variants as lookup tables

```tsx
const VARIANTS: Record<Variant, string> = {
  primary:   'bg-accent-600 text-white hover:bg-accent-700',
  secondary: 'bg-surface-100 text-ink-900 hover:bg-surface-200',
  ghost:     'bg-transparent text-ink-700 hover:bg-surface-100',
  danger:    'bg-danger-600 text-white hover:bg-danger-700',
};
```

A record, not a chain of conditionals — adding a variant becomes one line, and TypeScript makes an unhandled
variant a compile error. Colours come from **theme tokens**, never raw hex, so every component tracks the
project's palette and the user's theme automatically.

## Composition over configuration

```tsx
// ❌ A prop for every possible slot — endless and rigid.
<Card title="…" subtitle="…" icon={…} action={…} footer={…} badge={…} />

// ✅ Compose. The caller controls layout and can add anything.
<Card>
  <Card.Header>
    <Card.Icon><UploadIcon /></Card.Icon>
    <Card.Title>Uploads</Card.Title>
  </Card.Header>
  <Card.Body>…</Card.Body>
  <Card.Footer><Button size="sm">Manage</Button></Card.Footer>
</Card>
```

The first shape grows a prop per request forever; the second absorbs new requirements without changing the
component.

## Option cards

```tsx
<fieldset>
  <legend className="sr-only">Appearance</legend>
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
    {options.map((opt) => (
      <label key={opt.value} className={cn(cardBase, value === opt.value && cardSelected)}>
        <input
          type="radio" name={name} value={opt.value}
          checked={value === opt.value}
          onChange={() => onChange(opt.value)}
          className="sr-only"                 {/* visually hidden, still focusable + announced */}
        />
        <opt.Icon aria-hidden className="h-6 w-6" />
        <span className="font-medium">{opt.label}</span>
        {opt.description && <span className="text-sm opacity-70">{opt.description}</span>}
      </label>
    ))}
  </div>
</fieldset>
```

The real input stays in the DOM with `sr-only` rather than being replaced by a `div` — that is what keeps
keyboard navigation, arrow-key group behaviour, form submission and screen-reader announcement working for
free. A `<div onClick>` card is the version that fails an accessibility audit.

## D3 in React

Let React own the DOM and D3 own the maths:

```tsx
const x = scaleTime().domain(extent(data, d => d.date) as [Date, Date]).range([0, width]);
const y = scaleLinear().domain([0, max(data, d => d.value)!]).nice().range([height, 0]);
const path = line<Point>().x(d => x(d.date)).y(d => y(d.value))(data);

return <svg viewBox={`0 0 ${width} ${height}`}><path d={path ?? ''} /></svg>;
```

Use D3's scales, shapes and formatters; render with JSX. Reach for `d3.select()` only for transitions React
cannot express. This keeps charts theme-aware, responsive via `viewBox`, and free of a second rendering
system fighting React over the same nodes.
