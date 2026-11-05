# Docker

## Start the application

Build the production image and start the application with Docker Compose:

```bash
docker compose up --build
```

The application is available at <http://localhost:3000>.

The Compose service uses `host.docker.internal:2000` as the default API target.
Override it at runtime when the API runs at another address:

```bash
API_BASE_URL=http://host.docker.internal:9000 docker compose up --build
```

`API_BASE_URL` is passed to the running container as Nuxt's
`NUXT_API_BASE_URL` runtime configuration. The image does not need to be
rebuilt when the API target changes.

## Release images

Pushing a `vMAJOR.MINOR.PATCH` tag that matches the version in `package.json`
runs the release workflow. It type-checks and tests the app, publishes
`ghcr.io/looping-louie/app:<version>`, and creates a GitHub Release.

Published images support `linux/amd64` and `linux/arm64`; Docker selects the
matching image automatically. A Raspberry Pi 4 needs a 64-bit operating system
because 32-bit `linux/arm/v7` is not published.

## Check the service

Show the container status and health state:

```bash
docker compose ps
```

The container reports `healthy` after the Nuxt server responds on port `3000`.

## Stop the application

Stop and remove the Compose container:

```bash
docker compose down
```
