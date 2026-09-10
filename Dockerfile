FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG API_PROXY_TARGET=http://host.docker.internal:8000
ENV API_PROXY_TARGET=${API_PROXY_TARGET}
RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /app/.output ./.output

EXPOSE 3000

HEALTHCHECK --interval=30s --start-period=10s --timeout=5s --retries=3 CMD wget --spider --quiet http://127.0.0.1:3000/ || exit 1

CMD ["node", ".output/server/index.mjs"]
