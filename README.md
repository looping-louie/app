# Looping Louie App

Nuxt-based dashboard for visually controlling the Looping Louie platform.

## Installation

Clone the repository and install its dependencies:

```bash
git clone <repository-url>
cd looping-louie-app
npm install
```

For a containerized installation, follow the instructions in
[`doc/docker.md`](doc/docker.md).

## Configuration

The application uses `NUXT_API_BASE_URL` to locate the Looping Louie API. It
defaults to `http://127.0.0.1:8000` for local execution.

Create a local environment file from the template:

```bash
cp assets/config/.env.tpl .env
```

Edit `.env` when the API runs at another address:

```env
NUXT_API_BASE_URL=http://127.0.0.1:8000
```

The `.env` file is ignored by Git. The tracked template is available at
[`assets/config/.env.tpl`](assets/config/.env.tpl).

## Execution

Start the Nuxt development server:

```bash
npm run dev
```

The application is available at <http://localhost:3000>.

To build and run the production server locally:

```bash
npm run build
node .output/server/index.mjs
```

The production server also reads `NUXT_API_BASE_URL` from its environment. See
[`doc/docker.md`](doc/docker.md) for the Docker execution workflow.
