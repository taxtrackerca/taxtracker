// /pages/api/resume-subscription.js
import Stripe from 'stripe';
import { getAuth } from 'firebase-admin/auth';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, '\n'),
    }),
  });
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: 'Missing UID' });

    const userRecord = await getAuth().getUser(uid);
    const email = userRecord.email;
    if (!email) return res.status(404).json({ error: 'Email not found for UID' });

    // Find Stripe customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (!customers.data.length) return res.status(404).json({ error: 'No Stripe customer found for email' });

    const customerId = customers.data[0].id;

    // Find the paused subscription
    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'all' });
    const sub = subscriptions.data.find(s => s.status === 'paused' || s.pause_collection);

    if (!sub) return res.status(404).json({ error: 'No paused subscription found' });

    // Resume subscription (remove pause_collection)
    await stripe.subscriptions.update(sub.id, {
      pause_collection: '',
    });

    // Check if billing cycle already ended
    const now = Math.floor(Date.now() / 1000); // current time in seconds
    if (now > sub.current_period_end) {
      // Invoice immediately to reactivate access
      await stripe.invoices.createAndSendInvoice({ customer: customerId });
    }

    // Update Firestore
    const db = admin.firestore();
    await db.collection('users').doc(uid).update({ paused: false });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error resuming subscription:', err);
    res.status(500).json({ error: err.message });
  }
}