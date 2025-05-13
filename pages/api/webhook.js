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
  let event;

  try {
    // Dev mode: skip signature check
    event = JSON.parse(buf.toString());
    console.log(`✅ Stripe event: ${event.type}`);
  } catch (err) {
    console.error('❌ JSON parse error:', err.message);
    return res.status(400).send('Invalid payload');
  }

  if (event.type === 'invoice.paid') {
    try {
      const invoice = event.data.object;
      const customerId = invoice.customer;

      // 🔍 1. Fetch Stripe customer to get metadata
      const customer = await stripe.customers.retrieve(customerId);
      const firebaseUid = customer.metadata?.firebaseUid;

      if (!firebaseUid) {
        console.log("❌ No UID found in customer metadata");
        return res.status(200).send('Missing firebaseUid');
      }

      console.log("🔑 Firebase UID:", firebaseUid);

      // 🔍 2. Lookup Firestore user
      const userRef = db.collection('users').doc(firebaseUid);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        console.log("❌ User doc not found for UID:", firebaseUid);
        return res.status(200).send('User not found');
      }

      const userData = userSnap.data();

      console.log("📄 Found user:", userData.email);

      // 🎯 3. Apply referral logic
      if (userData.referredBy && !userData.referralRewarded) {
        const referrerRef = db.collection('users').doc(userData.referredBy);
        const referrerSnap = await referrerRef.get();

        if (referrerSnap.exists) {
          const currentCredits = referrerSnap.data().credits || 0;
          await referrerRef.update({ credits: currentCredits + 1 });
          await userRef.update({ referralRewarded: true });

          console.log(`🎉 Referral credit added to ${userData.referredBy}`);
        } else {
          console.log("⚠️ Referrer not found:", userData.referredBy);
        }
      }

      return res.status(200).send('Referral check complete');
    } catch (err) {
      console.error("❌ Webhook error:", err.message);
      return res.status(500).send('Internal error');
    }
  }

  return res.status(200).send('Event received');
}