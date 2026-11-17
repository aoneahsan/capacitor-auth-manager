# Patterns — when each one earns its place

Reference material. Load this only when choosing or reviewing a specific pattern.

## Creational

| Pattern | Use when | Do not use when |
|---|---|---|
| **Factory Method** | the concrete type depends on runtime context | there is only ever one type |
| **Abstract Factory** | you need families of related objects that must stay consistent | one factory would do |
| **Builder** | a constructor has many optional parameters, or construction has ordered steps | an object literal is clearer |
| **Prototype** | copying an existing configured instance beats rebuilding it | construction is cheap |
| **Singleton** | a genuinely single resource (a connection pool, a logger) | you just want global access — prefer module scope or injection; a singleton is a global with hidden coupling and makes testing harder |

## Structural

| Pattern | Use when |
|---|---|
| **Adapter** | an existing interface does not match what a caller needs, and you control neither side |
| **Bridge** | abstraction and implementation must vary independently (otherwise you get a class explosion) |
| **Composite** | data is tree-shaped and leaves and branches should be treated uniformly |
| **Decorator** | behaviour must be added per-instance without subclassing |
| **Facade** | a subsystem is messy and callers need one coherent entry point |
| **Flyweight** | many objects share most of their state and memory pressure is measured, not assumed |
| **Proxy** | you need lazy loading, caching, access control, or logging around an object |

## Behavioural

| Pattern | Use when | Typical smell it fixes |
|---|---|---|
| **Strategy** | several interchangeable algorithms | a conditional selecting behaviour, repeated |
| **Observer** | one change must notify many listeners | manual callback bookkeeping |
| **Command** | an action must become a value — queued, logged, undone | direct calls with no audit or undo |
| **State** | behaviour differs by status | a large `switch (status)` in several methods |

## A worked example — Strategy over a growing conditional

```ts
// Before: every new format edits this function.
function serialize(data: Report, format: string): string {
  if (format === 'json') return JSON.stringify(data);
  if (format === 'csv') return toCsv(data);
  if (format === 'xml') return toXml(data);
  throw new Error(`Unknown format: ${format}`);
}

// After: a new format adds an entry, edits nothing.
type Serializer = (data: Report) => string;

const SERIALIZERS: Record<string, Serializer> = {
  json: (d) => JSON.stringify(d),
  csv: toCsv,
  xml: toXml,
};

function serialize(data: Report, format: string): string {
  const serializer = SERIALIZERS[format];
  if (!serializer) throw new Error(`Unknown format: ${format}`);
  return serializer(data);
}
```

This is Open/Closed in practice: extending the behaviour no longer means editing the function that uses it.
Note it is also barely more code — a pattern that triples the line count to remove one conditional has not
earned its place.

## Reference sources the owner named

- refactoring.guru/design-patterns — catalog with per-pattern trade-offs
- sourcemaking.com/design_patterns — the same catalog with different worked examples
- github.com/webpro/programming-principles — the principles list, tersely stated
