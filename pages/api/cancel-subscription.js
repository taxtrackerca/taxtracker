// pages/api/cancel-subscription.js
import { getAuth } from 'firebase-admin/auth';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
    }),
  });
}
const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = await getAuth().verifyIdToken(idToken);
    const uid = decoded.uid;

    const userDoc = await db.collection('users').doc(uid).get();
    const subscriptionId = userDoc.data()?.subscriptionId;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'No active subscription found.' });
    }

    // Cancel subscription immediately
    await stripe.subscriptions.del(subscriptionId);

    // Optional: update Firestore
    await db.collection('users').doc(uid).update({
      subscriptionId: admin.firestore.FieldValue.delete(),
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}