import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const getRawBody = async (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  let event;

  try {
    const buf = await getRawBody(req); // only now read raw body
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log(`✅ Stripe event received: ${event.type}`);
  } catch (err) {
    console.error('❌ Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ Immediately respond to Stripe to avoid timeout
  res.status(200).send('Received');

  // 🔁 Detach long work from the main thread
  setImmediate(() => {
    handleStripeEvent(event).catch((err) => {
      console.error(`❌ Error handling ${event.type}:`, err);
    });
  });
}

async function handleStripeEvent(event) {
  if (event.type !== 'charge.succeeded') return;

  const charge = event.data.object;
  if (!charge.amount || charge.amount === 0) return;

  const stripeCustomerId = charge.customer;
  const userQuery = await db.collection('users')
    .where('stripeCustomerId', '==', stripeCustomerId)
    .limit(1)
    .get();

  if (userQuery.empty) return;

  const userDoc = userQuery.docs[0];
  const userData = userDoc.data();

  if (!userData.referredBy || userData.referredBy === 'used') return;

  const referrerDoc = await db.collection('users').doc(userData.referredBy).get();
  if (!referrerDoc.exists) return;

  const referrerData = referrerDoc.data();
  const referrerStripeId = referrerData.stripeCustomerId;
  if (!referrerStripeId) return;

  // ✅ Apply Stripe credit grant
  await stripe.customers.createBalanceTransaction(referrerStripeId, {
    amount: -495,
    currency: 'cad',
    description: `Referral reward: ${userData.email} signed up`,
  });

  console.log("✅ Applied $4.95 credit to referrer");

  await userDoc.ref.update({ referredBy: 'used' });
  console.log(`🎉 Referral marked as used for UID: ${userDoc.id}`);
}