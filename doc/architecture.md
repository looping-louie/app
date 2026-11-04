# Looping Louie App Architecture

## Repository Structure

The Nuxt application source lives under `src/`. It keeps route pages under
`src/pages/`, reusable visual units under `src/components/`, shared reactive
behavior under `src/composables/`, and API contracts under `src/types/`.
Utilities in `src/utils/` are framework-independent where possible and are
covered by unit tests in `tests/unit/`.

## Routing

Nuxt file-based routes use the structure under `src/pages/`. A collection route
that has descendants must use an `index.vue` file inside its directory:

```text
src/pages/(app)/runs/
|-- index.vue       /runs
`-- [id].vue        /runs/:id
```

The `(app)` directory is a Nuxt route group. Route groups organize related
pages without adding their name to the URL, so
`src/pages/(app)/runs/index.vue` maps to `/runs`, not `/app/runs`. This project
uses the group for operational application pages that share the `app` layout.
Nuxt also exposes the group as `route.meta.groups` when route-specific behavior
needs it.

The standalone visual showcase lives in `src/design-system/`, alongside
application directories such as `src/layouts/` and `src/pages/`. It is
development-only source, not a production Nuxt page. During `npm run dev`,
`nuxt.config.ts` registers it at `/dev/design-system`; production builds exclude
that route. It must not be moved under `src/pages/` unless a public product route
is explicitly required.

Do not define both `src/pages/(app)/runs.vue` and `src/pages/(app)/runs/`. Nuxt treats
that file-directory pairing as a route collision and can omit descendant routes
without an application error. The `pageRouteLayout` unit test prevents this
pattern across the application.

Shared UI that must appear on independent child routes belongs in a reusable
component or Nuxt layout, not a colliding parent route file. For example,
`SettingsPageShell` supplies Settings navigation to each `/settings` page.
Every page under `src/pages/(app)` must declare `layout: 'app'` so it retains the
global sidebar and application shell after route restructuring. The
`pageRouteLayout` unit test enforces both requirements.

## Run Navigation

The Runs catalog at `/runs` opens a summary preview drawer through query state.
Full execution investigation uses `/runs/:runId` with `project` and `pipeline`
query parameters because the API requires that context to read a run. The
catalog and preview both provide an explicit action to open the full detail
page.

## Client polling

[`src/utils/pollingPolicy.ts`](../src/utils/pollingPolicy.ts) is the single
source of truth for API polling cadence. It defines the current policy:

- Active, prepared, and waiting Pipeline runs poll every 60 seconds.
- Pipeline catalogs refresh every 60 seconds.
- Human-gate notifications refresh every 60 seconds because each refresh lists
  runs for every accessible Project and may require multiple paginated requests.

Polling composables own their request scope, error state, and timer lifecycle.
They must prevent overlapping requests, pause while the document is hidden,
resume with an immediate refresh when it becomes visible, and clear timers on
unmount. Pages may provide manual refresh controls, but must not introduce
independent periodic refreshes for resources already owned by a polling
composable.

Add a new polling cadence to `pollingPolicy.ts` only when it represents a
distinct request cost and freshness requirement. Pair the addition with a unit
test that protects any relationship between policy values.
