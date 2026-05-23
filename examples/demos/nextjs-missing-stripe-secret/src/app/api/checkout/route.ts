export async function POST() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return Response.json({ error: 'Stripe is not configured' }, { status: 500 });
  }

  return Response.json({ ok: true });
}
