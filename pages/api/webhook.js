import Stripe from 'stripe';
import { buffer } from 'micro';
import handleInvoicePaid from '../../lib/stripe/handleInvoicePaid';

export const config = {
  api: { bodyParser: false },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log(`✅ Stripe event received: ${event.type}`);
  } catch (err) {
    console.error('❌ Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ Immediate response to Stripe
  res.status(200).send('Received');

  // 🔁 Route specific events to handlers
  if (event.type === 'invoice.paid') {
    handleInvoicePaid(event).catch(err =>
      console.error('❌ Error handling invoice.paid:', err)
    );
  }
}