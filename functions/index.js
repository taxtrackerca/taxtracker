import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2/options';
import admin from 'firebase-admin';
import express from 'express';
import Stripe from 'stripe';

// ✅ Set region and load secrets
setGlobalOptions({
  region: 'us-central1',
  secrets: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
});

// ✅ Initialize Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// ✅ Setup express app for Stripe
const app = express();
app.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });

  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Stripe signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`✅ Stripe event received: ${event.type}`);

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object;

    try {
      const customer = await stripe.customers.retrieve(invoice.customer);
      const uid = customer.metadata?.firebaseUid;

      if (!uid) {
        console.warn('⚠️ No firebaseUid found on customer');
        return res.status(200).send('No action required');
      }

      const userRef = db.collection('users').doc(uid);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        console.warn('⚠️ User not found');
        return res.status(200).send('No user found');
      }

      const userData = userSnap.data();

      // ✅ Update user as paid
      await userRef.update({
        referralStatus: 'paid',
        firstPaymentDate: new Date(),
      });

      // ✅ Grant credit if not yet granted
      if (userData.referredBy && !userData.referralRewarded) {
        const referrerRef = db.collection('users').doc(userData.referredBy);
        const referrerSnap = await referrerRef.get();

        if (referrerSnap.exists) {
          const currentCredits = referrerSnap.data().credits || 0;
          await referrerRef.update({ credits: currentCredits + 1 });
          await userRef.update({ referralRewarded: true });

          console.log(`🎉 Granted credit to referrer ${userData.referredBy}`);
        }
      }

      return res.status(200).send('invoice.paid processed');
    } catch (err) {
      console.error('❌ Failed to process invoice.paid:', err);
      return res.status(500).send('Internal error');
    }
  }

  res.status(200).send('Event received');
});

// ✅ Export function to Firebase
export const stripeWebhook = onRequest({ rawRequest: true }, app);