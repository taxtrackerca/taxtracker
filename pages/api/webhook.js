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
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
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
    console.log(`✅ Stripe event: ${event.type}`);
  } catch (err) {
    console.error('❌ Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ Always respond quickly to Stripe
  res.status(200).send('Received');

  // ✅ Continue processing async (outside response)
  if (event.type === 'customer.subscription.created') {
    try {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      // 1. Fetch Stripe customer metadata
      const customer = await stripe.customers.retrieve(customerId);
      const firebaseUid = customer.metadata?.firebaseUid;

      if (!firebaseUid) {
        console.log("❌ No UID found in customer metadata");
        return;
      }

      console.log("🔑 Firebase UID:", firebaseUid);

      // 2. Get Firestore user
      const userRef = db.collection('users').doc(firebaseUid);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        console.log("❌ User doc not found:", firebaseUid);
        return;
      }

      const userData = userSnap.data();
      console.log("📄 Found user:", userData.email || 'no-email');

      // ✅ Access referral fields directly and safely
      const referredBy = userData?.referredBy;
      const referralRewarded = userData?.referralRewarded || false;

      if (referredBy && !referralRewarded) {
        const referrerRef = db.collection('users').doc(referredBy);
        const referrerSnap = await referrerRef.get();

        if (referrerSnap.exists) {
          const currentCredits = referrerSnap.data().credits || 0;
          await referrerRef.update({ credits: currentCredits + 1 });
          await userRef.update({ referralRewarded: true });

          console.log(`🎉 Referral credit added to ${referredBy}`);
        } else {
          console.log("⚠️ Referrer not found:", referredBy);
        }
      }
    } catch (err) {
      console.error("❌ Webhook processing error:", err.message);
    }
  }
}