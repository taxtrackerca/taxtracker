// pages/api/webhook.js
import { buffer } from 'micro';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

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
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log(`✅ Received Stripe event: ${event.type}`);
  } catch (err) {
    console.error('❌ Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_email;
    const subscriptionId = session.subscription;
  
    if (!email || !subscriptionId) return res.status(200).send('Missing data');
  
    try {
      const snapshot = await db.collection('users').where('email', '==', email).get();
      if (!snapshot.empty) {
        await snapshot.docs[0].ref.update({ subscriptionId });
      }
    } catch (err) {
      console.error('❌ Firestore update error:', err.message);
    }
  }
  
  if (event.type === 'customer.subscription.created') {
    const subscription = event.data.object;
    const firebaseUid = subscription.metadata?.firebaseUid;
    const subscriptionId = subscription.id;
  
    if (!firebaseUid || !subscriptionId) return res.status(200).send('Missing data');
  
    try {
      await db.collection('users').doc(firebaseUid).set({ subscriptionId }, { merge: true });
    } catch (err) {
      console.error('❌ Firestore update error:', err.message);
    }
  }

  res.status(200).json({ received: true });
}