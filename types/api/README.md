# API contracts

These TypeScript contracts manually mirror the Pydantic schemas in
`../api/src/app/schemas` and the routes in `../api/src/app/routers`.

Until the API publishes an OpenAPI document, update this directory and
`composables/useApiClient.ts` whenever those schemas or routes change. Pages
should consume the shared client and must not redefine API response shapes
locally.

`pages/legacy` is intentionally outside this migration and the typecheck.
