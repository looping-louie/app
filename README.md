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

Create a local environment file `.env` in the root of your project (this
`.env` file will be ignored by Git) You can find the template for this `.env`
file at [`assets/config/.env.tpl`](assets/config/.env.tpl).

```bash
cp assets/config/.env.tpl .env
```

Edit `.env` with your desired configuration:

```env
NUXT_API_BASE_URL=http://127.0.0.1:8000
```

## Execution

To build and run the production server locally, run:

```bash
npm run build
node .output/server/index.mjs
```

## Development

Start the Nuxt development server like this:

```bash
npm run dev
```

The application will be available at <http://localhost:3000> (by default).

The development-only design system preview is available at
<http://localhost:3000/dev/design-system>. Use it as the visual and interaction
reference when designing or changing any UI component, page, or workflow. This
route is not included in production builds.

## Docker

The production server also reads `NUXT_API_BASE_URL` from its environment. See
[`doc/docker.md`](doc/docker.md) for the Docker execution workflow.
