# Next.js missing Stripe secret demo

This fixture shows a common deployment drift failure: a Next.js API route references `STRIPE_SECRET_KEY`, but the env template does not document it.

Run:

```bash
pnpm scan -- --path examples/demos/nextjs-missing-stripe-secret --ci
```

Expected result:

- Secret Coverage reports `STRIPE_SECRET_KEY` as `missing-from-template`.
- CI mode exits non-zero because the deploy depends on an undocumented server-side variable.
- No raw secret values are required or printed.

Safe fix:

```dotenv
STRIPE_SECRET_KEY=
```

Add the variable name to `.env.example`, then configure the real value in the deployment environment before merging the checkout route.
