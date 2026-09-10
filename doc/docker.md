# Docker

## Start the application

Build the production image and start the application with Docker Compose:

```bash
docker compose up --build
```

The application is available at <http://localhost:3000>.

The Compose service uses `host.docker.internal:8000` as the default API target.
Override it when the API runs at another address:

```bash
API_PROXY_TARGET=http://host.docker.internal:9000 docker compose up --build
```

`API_PROXY_TARGET` is a build argument because Nuxt resolves the API proxy
during the production build.

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
