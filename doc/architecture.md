# Looping Louie App Architecture

## Repository Structure

The Nuxt application keeps route pages under `pages/`, reusable visual units
under `components/`, shared reactive behavior under `composables/`, and API
contracts under `types/`. Utilities in `utils/` are framework-independent where
possible and are covered by unit tests in `tests/unit/`.

## Routing

Nuxt file-based routes use the structure under `pages/`. A collection route
that has descendants must use an `index.vue` file inside its directory:

```text
pages/(app)/runs/
|-- index.vue       /runs
`-- [id].vue        /runs/:id
```

Do not define both `pages/(app)/runs.vue` and `pages/(app)/runs/`. Nuxt treats
that file-directory pairing as a route collision and can omit descendant routes
without an application error. The `pageRouteLayout` unit test prevents this
pattern across the application.

Shared UI that must appear on independent child routes belongs in a reusable
component or Nuxt layout, not a colliding parent route file. For example,
`SettingsPageShell` supplies Settings navigation to each `/settings` page.

## Run Navigation

The Runs catalog at `/runs` opens a summary preview drawer through query state.
Full execution investigation uses `/runs/:runId` with `project` and `pipeline`
query parameters because the API requires that context to read a run. The
catalog and preview both provide an explicit action to open the full detail
page.
