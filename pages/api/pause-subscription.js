// pages/api/pause-subscription.js
import Stripe from 'stripe';
import * as admin from 'firebase-admin';
import { doc, setDoc } from 'firebase/firestore';
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
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: 'Missing UID' });

    const userRecord = await admin.auth().getUser(uid);
    const email = userRecord.email;
    if (!email) return res.status(400).json({ error: 'No email found for user' });

    // Get Stripe customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer = customers.data[0];
    if (!customer) return res.status(404).json({ error: 'Stripe customer not found' });

    const customerId = customers.data[0].id;
    // Find active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all', // grab all statuses including trialing
      limit: 3,      // look at a few just in case
    });

    const subscription = subscriptions.data.find(sub => 
      sub.status === 'active' || sub.status === 'trialing'
    );
    
    if (!subscription) throw new Error('No active subscription found');

    // Pause subscription: stop future payments after current billing cycle
    await stripe.subscriptions.update(subscription.id, {
      pause_collection: {
        behavior: 'mark_uncollectible',
        resumes_at: null,
      },
    });

    // Mark paused in Firestore
    await setDoc(doc(db, 'users', uid), { paused: true }, { merge: true });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Error pausing subscription:', err);
    res.status(400).json({ error: err.message });
  }
}