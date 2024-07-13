FROM oven/bun:1 AS base
WORKDIR /usr/src/app

COPY package.json .
RUN bun install --production

COPY . .
RUN bun build --compile index.ts

FROM gcr.io/distroless/base-nossl-debian11
WORKDIR /usr/src/app

COPY --from=base /usr/src/app/index .

CMD ["./index"]