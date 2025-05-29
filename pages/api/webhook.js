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

const getRawBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

// 🚫 NOT an async function!
export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end('Method Not Allowed');
    return;
  }

  getRawBody(req)
    .then((buf) => {
      const sig = req.headers['stripe-signature'];

      let event;
      try {
        event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
        console.log(`✅ Stripe event received: ${event.type}`);
      } catch (err) {
        console.error('❌ Signature verification failed:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
      }

      // ✅ Respond FIRST before any processing
      res.status(200).send('Received');

      // ✅ Do long async work afterward, completely detached
      setImmediate(() => {
        handleStripeEvent(event).catch((err) =>
          console.error(`❌ Error in handleStripeEvent:`, err)
        );
      });
    })
    .catch((err) => {
      console.error('❌ Failed to read raw body:', err);
      res.status(500).send('Internal Server Error');
    });
}

async function handleStripeEvent(event) {
  if (event.type !== 'charge.succeeded') return;

  const charge = event.data.object;
  if (!charge.amount || charge.amount === 0) return;

  const stripeCustomerId = charge.customer;

  const userQuery = await db
    .collection('users')
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

  // ✅ Stripe credit grant instead of anchor update
  await stripe.customers.createBalanceTransaction(referrerStripeId, {
    amount: -495,
    currency: 'cad',
    description: `Referral reward: ${userData.email} signed up`,
  });

  console.log('✅ Credit granted to referrer');

  await userDoc.ref.update({ referredBy: 'used' });
  console.log(`🎉 Referral marked as used for UID: ${userDoc.id}`);
}