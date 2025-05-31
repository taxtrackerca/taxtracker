import Stripe from 'stripe';

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const rawBody = await request.text();
    const headers = Object.fromEntries(request.headers.entries());

    console.log("✅ Received webhook from Stripe, forwarding raw payload to Firebase");

    ctx.waitUntil(
      fetch('https://us-central1-taxtracker-1ab56.cloudfunctions.net/stripeWebhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': headers['stripe-signature'], // ✅ important
        },
        body: rawBody, // ✅ send raw body, untouched
      })
        .then((res) =>
          res.text().then((text) =>
            console.log("📤 Forwarded to Firebase webhook:", res.status, text)
          )
        )
        .catch((err) =>
          console.error("❌ Failed to forward to Firebase:", err)
        )
    );

    return new Response('Received', { status: 200 });
  },
};