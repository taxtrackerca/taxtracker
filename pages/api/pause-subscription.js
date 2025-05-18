import Stripe from 'stripe';
import * as admin from 'firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: 'Missing UID' });

  try {
    const userDoc = await db.collection('users').doc(uid).get();
    const subscriptionId = userDoc.data()?.subscriptionId;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'No subscription found for user' });
    }

    // Schedule pause at end of billing period
    await stripe.subscriptions.update(subscriptionId, {
      pause_collection: {
        behavior: 'mark_uncollectible',
        resumes_at: null, // Manual resume
      },
    });

    await db.collection('users').doc(uid).update({
      pauseRequested: true,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Pause subscription error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}