# Testing

## Unit tests

Run `npm test`. Unit tests cover cursor pagination, JWT claims, application health, malformed JSON handling, and consistent unknown-route errors.

## API integration tests

Integration tests use the actual Fastify HTTP interface and never call services directly. They create a separate database, execute migrations, exercise all public API areas, verify validation and a cross-tenant `403`, and verify that task assignment creates a queryable background job.

```bash
docker compose -f docker-compose.test.yml up -d --wait
cp .env.test.example .env.test
set -a; source .env.test; set +a
npm run test:integration
docker compose -f docker-compose.test.yml down -v
```

The integration suite calls `dropDatabase()` only against the `taskflow_test` database declared in `.env.test`; never point it to development or production.
