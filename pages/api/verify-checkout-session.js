import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import Stripe from 'stripe';

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
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { sessionId } = req.body;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const customerId = session.customer;

    const customer = await stripe.customers.retrieve(customerId);
    const firebaseUid = customer.metadata?.firebaseUid;

    if (!firebaseUid) throw new Error('Missing firebaseUid');

    // ✅ Get subscription
    const subscriptionId = session.subscription;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const status = subscription.status;

    await db.collection('users').doc(firebaseUid).set(
      {
        subscribed: true,
        stripeCustomerId: customerId,
        subscriptionStatus: status, // <-- Save for logic checks
      },
      { merge: true }
    );

    console.log(`✅ Marked user ${firebaseUid} as subscribed (${status})`);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Failed to verify checkout session:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}