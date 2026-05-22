# Docker Compose missing Redis URL demo

This fixture intentionally models a common deployment drift bug in local-preview and worker stacks:

- `docker-compose.yml` references `REDIS_URL` for both the web service and worker.
- `.env.example` documents `APP_ENV` and `DATABASE_URL`, but not `REDIS_URL`.
- Secret Coverage should report the missing environment contract before someone tries to run or deploy the Compose stack.

Run from the repository root:

```bash
pnpm scan -- --path examples/demos/docker-compose-missing-redis-url --ci
```

Expected result: the command exits non-zero because a Docker Compose environment reference is missing from the declared env template.
