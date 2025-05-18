// pages/api/subscription-status.js
import Stripe from 'stripe';
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end('Method Not Allowed');

  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = await getAuth().verifyIdToken(idToken);
    const email = decoded.email;
    if (!email) return res.status(400).json({ error: 'No email found.' });

    // 🔍 Get Stripe customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (!customers.data.length) return res.status(404).json({ error: 'No Stripe customer found.' });

    const customerId = customers.data[0].id;

    // 🔍 Find subscription (active or paused)
    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 1 });
    if (!subscriptions.data.length) return res.status(404).json({ error: 'No subscription found.' });

    const sub = subscriptions.data[0];

    res.status(200).json({
      status: sub.status,
      currentPeriodEnd: sub.current_period_end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      pauseCollection: sub.pause_collection,
    });
  } catch (err) {
    console.error('❌ Error fetching subscription status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}