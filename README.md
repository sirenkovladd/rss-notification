# rss-notification

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

.env

```
REDIS_PASSWORD=
REDIS_HOST=
REDIS_PORT=
TELEGRAM_TOKEN=
```

add to redis key `rssList` = {"<TELEGRAM_ID>": ["<RSS_LINK>"]}'
