// /pages/api/pause-subscription.js
import Stripe from 'stripe';
import { getAuth } from 'firebase-admin/auth';
import * as admin from 'firebase-admin';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, '\n'),
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });

    const userRecord = await admin.auth().getUser(uid);
    const customerEmail = userRecord.email;

    // Find Stripe customer
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    if (!customers.data.length) throw new Error('Customer not found');

    const customerId = customers.data[0].id;

    // Find the active subscription
    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
    if (!subscriptions.data.length) throw new Error('No active subscription');

    const subscription = subscriptions.data[0];

    // Pause the subscription at the end of current period
    await stripe.subscriptions.update(subscription.id, {
      pause_collection: { behavior: 'mark_uncollectible', resumes_at: null },
    });

    await setDoc(doc(db, 'users', uid), { paused: true }, { merge: true });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}
