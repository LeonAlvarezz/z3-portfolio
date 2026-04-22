# ── Shared base: bun + deps + source ──────────────────────────────────────────
FROM oven/bun:1.3.9 AS base
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY src ./src
COPY tsconfig.json ./
COPY drizzle.config.ts ./
COPY drizzle ./drizzle

# ── Build: compile to single binary ───────────────────────────────────────────
FROM base AS build
ENV NODE_ENV=production
RUN bun build \
    --compile \
    --minify-whitespace \
    --minify-syntax \
    --target bun \
    --outfile server \
    src/app.ts

# ── Migrator: needs bun runtime + source + drizzle folder ─────────────────────
FROM base AS migrator
ENV NODE_ENV=production
CMD ["bun", "run", "db:migrate"]

# ── App: distroless, binary only ──────────────────────────────────────────────
FROM gcr.io/distroless/base AS app
WORKDIR /app
COPY --from=build /app/server ./server
ENV NODE_ENV=production
EXPOSE 3000
CMD ["./server"]
