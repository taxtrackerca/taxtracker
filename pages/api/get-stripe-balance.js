// pages/api/get-stripe-balance.js
import Stripe from 'stripe';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const { uid } = req.query;

  try {
    const userDoc = await db.collection('users').doc(uid).get();
    const stripeCustomerId = userDoc.data().stripeCustomerId;

    const customer = await stripe.customers.retrieve(stripeCustomerId);
    const balanceCents = customer.balance || 0;

    res.status(200).json({
      balance: (balanceCents / 100).toFixed(2),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve Stripe balance' });
  }
}