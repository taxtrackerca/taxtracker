const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Stripe = require('stripe');
const { buffer } = require('micro');

admin.initializeApp();

exports.stripeWebhook = functions
  .region('us-central1')
  .runWith({ secrets: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'] })
  .https.onRequest(async (req, res) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    let event;
    try {
      const sig = req.headers['stripe-signature'];
      const rawBody = await buffer(req);

      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      console.log(`✅ Stripe event received: ${event.type}`);
    } catch (err) {
      console.error(`❌ Webhook signature error:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // 🔍 Sample handler for invoice.paid
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object;
      const customerEmail = invoice.customer_email || invoice.customer;

      console.log(`🎉 invoice.paid event received for customer: ${customerEmail}`);
      // (Optional) Add logic to give referral credit here

      res.status(200).send('invoice.paid handled');
      return;
    }

    res.status(200).send('Event received');
  });