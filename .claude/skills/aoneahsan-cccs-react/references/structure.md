# App skeleton

## Providers and routes

```tsx
// App.tsx — order matters: outer providers must not depend on inner ones.
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <ScrollToTop />
          <ErrorBoundary fallback={<ErrorPage code={500} />}>
            <Suspense fallback={<BootLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="*" element={<ErrorPage code={404} />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

The `*` route is not optional — without it an unmatched URL renders nothing at all.

## ScrollToTop

```tsx
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
}
```

`behavior: 'instant'` on navigation — a smooth scroll to top on every route change reads as lag.

## Go-back button

```tsx
// Absolute targets, derived from the hierarchy — declared, not inferred from history.
const PARENT_ROUTE: Record<string, string> = {
  '/settings/profile': '/settings',
  '/settings': '/dashboard',
  '/blog/:slug': '/blog',
};
```

Why not `router.back()`: if the user arrived by deep link, a refresh, or a post-login redirect, the previous
history entry is not the parent — it is an unrelated page, another site, or nothing.

## Error boundary

```tsx
class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('Render error', error, info.componentStack);   // logger, never console
  }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}
```

Place one at the app root and one around any independently-failing region (a dashboard widget, an embedded
tool) so a single failure does not blank the page.

## RBAC

🔴 **The rung list below is a SHAPE, not a set to install.** Declare only the rungs this project's gates
actually read, and record them in `docs/admin/ADMIN-SURFACE.md` beside the line that reads each one. A rung
nothing checks is assignable and meaningless — one shipped app carried a `moderator` value read nowhere.
Deriving the ladder, and the two-rung case: **`aoneahsan-cccs-platform-admin`**.

```ts
// Illustrative. A real project declares its OWN rungs — often just two.
export const ROLES = ['superadmin', 'admin', 'user'] as const;
export type Role = (typeof ROLES)[number];

const RANK: Record<Role, number> = { superadmin: 50, admin: 40, user: 10 };

export const atLeast = (role: Role, min: Role) => RANK[role] >= RANK[min];
```

Gaps in `RANK` are deliberate — inserting a rung later should not renumber the others. Add
`manager/editor/creator` only where a content workflow genuinely exists; the older six-rung ladder is this
same ladder with those rungs added, and `super_admin`/`superadmin` are one rung, so pick one spelling.

**This is the PLATFORM ladder** — "staff of ours?". A product role (what someone is *inside* the product)
is a separate field, and on the membership row when the product is multi-tenant.

Client-side role checks are for **UI affordances only**. The real gate is the backend rule — see
`aoneahsan-cccs-firestore`. A hidden button is not access control.

🔴 **This ladder is the *platform* role** — "is this person staff of ours?". A **product** role — what someone
is *inside* the product — is a separate field, and in a multi-tenant product it lives on the **membership** row,
never on the profile as well. One writer per fact, or two fields answer one question and a policy reads
whichever the last code path wrote. Both levels, and the seeding that does not open a hole:
`aoneahsan-cccs-platform-admin/references/role-model.md`.

## Footer version

```tsx
// Capacitor: live from the native shell. Web: injected at build time.
const version = Capacitor.isNativePlatform()
  ? (await App.getInfo()).version
  : import.meta.env.VITE_APP_VERSION;
```

Expose the build number too where the platform has one — `v1.2.3 (build 45)`.

**Last updated:** 2026-08-03 (the RBAC block names its ladder as the platform level and points at the
product-role half)
