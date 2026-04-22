FROM oven/bun:1.3.9 AS build

WORKDIR /app

# Cache packages
COPY package.json ./
COPY bun.lock ./

RUN bun install --frozen-lockfile

COPY src ./src
COPY tsconfig.json ./
COPY drizzle.config.ts ./

ENV NODE_ENV=production

RUN bun build \
    --compile \
    --minify-whitespace \
    --minify-syntax \
    --target bun \
    --outfile server \
    src/app.ts

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/server ./server

ENV NODE_ENV=production

EXPOSE 3000

CMD ["./server"]

FROM base AS migrator
CMD ["bun", "run", "db:migrate"]
