import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const getRawBody = async (req) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
};

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

  const buf = await getRawBody(req);
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log(`✅ Stripe event received: ${event.type}`);
  } catch (err) {
    console.error('❌ Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ Respond immediately to Stripe to avoid Vercel timeout
  res.status(200).send('Received');

  // 🔄 Fully detach background processing
  setImmediate(() => {
    handleStripeEvent(event).catch(err => {
      console.error(`❌ Async error in event ${event.type}:`, err);
    });
  });
}

async function handleStripeEvent(event) {
  if (event.type !== 'charge.succeeded') return;

  const charge = event.data.object;
  console.log("🔄 Handling charge.succeeded event");

  if (!charge.amount || charge.amount === 0) {
    console.log('⚠️ Skipping charge with 0 amount');
    return;
  }

  const stripeCustomerId = charge.customer;
  console.log("🔍 Stripe Customer ID:", stripeCustomerId);

  const userQuery = await db.collection('users')
    .where('stripeCustomerId', '==', stripeCustomerId)
    .limit(1)
    .get();

  if (userQuery.empty) {
    console.log("❌ No user found with stripeCustomerId:", stripeCustomerId);
    return;
  }

  const userDoc = userQuery.docs[0];
  const userData = userDoc.data();

  console.log("👤 Found user:", userData.email);
  console.log("📦 User referredBy:", userData.referredBy);

  if (!userData.referredBy || userData.referredBy === 'used') {
    console.log("ℹ️ No referral action needed");
    return;
  }

  const referrerDoc = await db.collection('users').doc(userData.referredBy).get();
  if (!referrerDoc.exists) {
    console.log("⚠️ Referrer not found:", userData.referredBy);
    return;
  }

  const referrerData = referrerDoc.data();
  const referrerStripeId = referrerData.stripeCustomerId;

  if (!referrerStripeId) {
    console.log("⚠️ Referrer missing stripeCustomerId");
    return;
  }

  // ✅ Grant $4.95 credit to referrer using Stripe Credit Grant
  await stripe.customers.createBalanceTransaction(referrerStripeId, {
    amount: -495, // Stripe credits use negative amount (495 cents = $4.95)
    currency: 'cad',
    description: `Referral reward: ${userData.email} signed up`,
  });

  console.log("✅ Applied $4.95 credit to referrer");

  // ✅ Mark referral as used
  await userDoc.ref.update({ referredBy: 'used' });
  console.log(`🎉 Referral marked as used for UID: ${userDoc.id}`);
}