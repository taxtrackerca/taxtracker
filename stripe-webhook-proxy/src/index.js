import Stripe from 'stripe';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const rawBody = await request.text();
    const headers = Object.fromEntries(request.headers.entries());

    console.log("✅ Received webhook from Stripe, forwarding to Firebase");

    ctx.waitUntil(
      fetch("https://stripewebhook-pxtikbvqfa-uc.a.run.app", {
        method: "POST",
        headers,
        body: rawBody,
      }).then((res) =>
        res.text().then((text) => {
          console.log("📤 Forwarded to Firebase webhook:", res.status, text);
        })
      ).catch((err) => {
        console.error("❌ Failed to forward to Firebase webhook:", err);
      })
    );

    return new Response("Received", { status: 200 });
  }
};