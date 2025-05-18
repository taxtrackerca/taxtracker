// pages/api/resume-subscription.js
import Stripe from 'stripe';
import { admin, db } from '../../lib/firebase-admin'; // Assumes you have centralized admin setup

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: 'Missing user ID' });

  try {
    // Fetch the user document from Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    const subscriptionId = userData.subscriptionId;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'No subscription ID found for this user.' });
    }

    // Resume the subscription in Stripe
    await stripe.subscriptions.update(subscriptionId, {
      pause_collection: '',
    });

    // Update Firestore flag
    await db.collection('users').doc(uid).update({
      paused: false,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Resume error:', err);
    return res.status(500).json({ error: 'Failed to resume subscription' });
  }
}