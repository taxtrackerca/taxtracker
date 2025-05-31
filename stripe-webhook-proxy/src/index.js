import Stripe from 'stripe';

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const rawBody = await request.text();
    const headers = Object.fromEntries(request.headers.entries());

    console.log("✅ Received webhook from Stripe, forwarding to Firebase");

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    // Optional: verify signature
    try {
      const event = stripe.webhooks.constructEvent(rawBody, headers['stripe-signature'], env.STRIPE_WEBHOOK_SECRET);

      if (event.type === 'invoice.paid') {
        const invoice = event.data.object;

        ctx.waitUntil(
          fetch('https://stripewebhook-pxtikbvqfa-uc.a.run.app', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(invoice),
          }).then(res =>
            res.text().then(text =>
              console.log("📤 Forwarded invoice.paid to Firebase:", res.status, text)
            )
          ).catch(err =>
            console.error("❌ Error forwarding to Firebase:", err)
          )
        );
      }
    } catch (err) {
      console.error("❌ Stripe verification failed:", err.message);
    }

    return new Response("Received", { status: 200 });
  }
};