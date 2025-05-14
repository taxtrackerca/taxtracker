const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const Stripe = require('stripe');

admin.initializeApp();

const app = express();

// Disable Firebase's default body parser
app.use(
  express.raw({ type: 'application/json' })
);

app.post('/', async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });

  const sig = req.headers['stripe-signature'];
  const rawBody = req.body;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log(`✅ Stripe event received: ${event.type}`);
  } catch (err) {
    console.error('❌ Signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object;
    const customerEmail = invoice.customer_email || 'unknown';
    console.log(`🎉 Invoice paid for customer: ${customerEmail}`);
  }

  return res.status(200).send('Event received');
});

exports.stripeWebhook = functions
  .region('us-central1')
  .runWith({ secrets: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'] })
  .https.onRequest(app);