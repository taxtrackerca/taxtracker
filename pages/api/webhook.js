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

  if (event.type === 'charge.succeeded') {
    try {
      const charge = event.data.object;
      const amount = charge.amount;

      if (!amount || amount === 0) {
        console.log("ℹ️ Charge amount is $0, skipping.");
        return res.status(200).send('No action needed for $0 charge');
      }

      const stripeCustomerId = charge.customer;

      // Step 1: Find user by stripeCustomerId
      const userQuery = await db.collection('users')
        .where('stripeCustomerId', '==', stripeCustomerId)
        .limit(1)
        .get();

      if (userQuery.empty) {
        console.log("❌ No user found with stripeCustomerId:", stripeCustomerId);
        return res.status(200).send('User not found');
      }

      const userDoc = userQuery.docs[0];
      const userData = userDoc.data();

      if (!userData.referredBy || userData.referredBy === 'used') {
        console.log("ℹ️ No referral to process or already used.");
        return res.status(200).send('Referral already handled or not present');
      }

      const referrerUid = userData.referredBy;
      const referrerDoc = await db.collection('users').doc(referrerUid).get();

      if (!referrerDoc.exists) {
        console.log("⚠️ Referrer not found in Firestore:", referrerUid);
        return res.status(200).send('Referrer not found');
      }

      const referrerData = referrerDoc.data();
      const referrerStripeId = referrerData.stripeCustomerId;

      if (!referrerStripeId) {
        console.log("❌ Referrer missing stripeCustomerId");
        return res.status(200).send('Referrer stripeCustomerId missing');
      }

      const subscriptions = await stripe.subscriptions.list({
        customer: referrerStripeId,
        status: 'active',
        limit: 1,
      });

      const subscription = subscriptions.data[0];
      if (!subscription) {
        console.log("⚠️ No active subscription found for referrer");
        return res.status(200).send('No active subscription for referrer');
      }

      const currentPeriodEnd = subscription.current_period_end * 1000;
      const newDate = new Date(currentPeriodEnd);
      newDate.setMonth(newDate.getMonth() + 1);
      const newBillingAnchor = Math.floor(newDate.getTime() / 1000);

      await stripe.subscriptions.update(subscription.id, {
        billing_cycle_anchor: newBillingAnchor,
        proration_behavior: 'none',
      });

      await userDoc.ref.update({ referredBy: 'used' });

      console.log(`🎉 Extended referrer’s billing date by 1 month: ${referrerUid}`);
      return res.status(200).send('Referral processed');
    } catch (err) {
      console.error("❌ Webhook error:", err.message);
      return res.status(500).send('Internal error');
    }
  }

  return res.status(200).send('Event received');
}