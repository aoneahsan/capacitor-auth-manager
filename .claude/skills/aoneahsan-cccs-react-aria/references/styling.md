# Styling React Aria Components under Tailwind v4

The four styling mechanisms, the plugin registration, and why the data attributes beat `:hover`.

```tsx
// 1. Render-prop className — state without a single useState
<Button className={({isPressed, isFocusVisible, isDisabled}) => cn(
  'rounded-md bg-accent px-4 h-10 text-text-inverse',
  isPressed && 'bg-accent-hover',
  isFocusVisible && 'ring-2 ring-accent outline-none',
  isDisabled && 'opacity-50',
)} />

// 2. data-* attributes — with @plugin, the data- prefix disappears
<ListBoxItem className="selected:bg-accent-subtle disabled:opacity-50" />

// 3. slot — disambiguates repeated children
<NumberField><Button slot="increment">+</Button></NumberField>

// 4. default react-aria-* classes when no className is given
```

Register the plugin in CSS (v4 has no config file):

```css
@plugin "tailwindcss-react-aria-components";
```

**The data attributes are modality-correct** across mouse, touch and keyboard — `data-hovered` does not stick
after a tap the way `:hover` does on touch. That is a correctness win, not a convenience.
