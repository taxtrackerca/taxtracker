// pages/api/create-checkout-session.js
import Stripe from 'stripe';
import * as admin from 'firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Firebase Admin init
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { customerEmail, firebaseUid, trial = true } = req.body;

  try {
    // 🔍 Check if a customer already exists for this email
    const existing = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customer = existing.data[0];

    // ➕ If not found, create a new one
    if (!customer) {
      customer = await stripe.customers.create({
        email: customerEmail,
        metadata: {
          firebaseUid: firebaseUid || 'none',
        },
      });
    }

    // 💳 Create the checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customer.id,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: trial ? 30 : undefined,
        metadata: {
          firebaseUid: firebaseUid || 'none',
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/verify-email?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/signup`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe session creation error:', err);
    res.status(500).json({ error: err.message });
  }
}