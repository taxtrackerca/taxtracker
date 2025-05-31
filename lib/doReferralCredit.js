import * as admin from 'firebase-admin';
import Stripe from 'stripe';

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

export default async function doReferralCredit(stripeCustomerId) {
  const userQuery = await db
    .collection('users')
    .where('stripeCustomerId', '==', stripeCustomerId)
    .limit(1)
    .get();

  if (userQuery.empty) {
    console.log("❌ No user found for customer:", stripeCustomerId);
    return;
  }

  const userDoc = userQuery.docs[0];
  const userRef = userDoc.ref;
  const userData = userDoc.data();

  if (!userData.referredBy || userData.referredBy === 'used') {
    console.log("ℹ️ No referral credit needed or already used");
    return;
  }

  const referrerDoc = await db.collection('users').doc(userData.referredBy).get();
  if (!referrerDoc.exists) {
    console.log("❌ Referrer not found:", userData.referredBy);
    return;
  }

  const referrerData = referrerDoc.data();
  const referrerStripeId = referrerData.stripeCustomerId;

  if (!referrerStripeId) {
    console.log("⚠️ Referrer has no Stripe customer ID");
    return;
  }

  try {
    const result = await stripe.customers.createBalanceTransaction(referrerStripeId, {
      amount: -495,
      currency: 'cad',
      description: `Referral reward: ${userData.email} signed up`,
    });

    console.log("✅ Credit applied. TX ID:", result.id);
    await userRef.update({ referredBy: 'used' });
  } catch (err) {
    console.error("❌ Stripe error applying credit:", err.message);
  }
}