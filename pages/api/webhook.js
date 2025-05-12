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

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object;
    const customerEmail = invoice.customer_email;
  
    try {
      // Get the user who just paid
      const userSnap = await db.collection('users').where('email', '==', customerEmail).get();
      if (userSnap.empty) return res.status(200).send('User not found');
  
      const userDoc = userSnap.docs[0];
      const userData = userDoc.data();
  
      // Check if they were referred and have not already triggered a reward
      if (userData.referredBy && !userData.referralRewarded) {
        const referrerUid = userData.referredBy;
  
        // Add +1 credit to referrer
        const referrerRef = db.collection('users').doc(referrerUid);
        await db.runTransaction(async (t) => {
          const refDoc = await t.get(referrerRef);
          const refData = refDoc.data();
          const newCredits = (refData.credits || 0) + 1;
          t.update(referrerRef, { credits: newCredits });
          t.update(userDoc.ref, { referralRewarded: true }); // mark rewarded so it doesn't repeat
        });
  
        console.log(`🎉 Added 1 credit to referrer ${referrerUid} for user ${customerEmail}`);
      }
    } catch (err) {
      console.error('❌ Referral credit error:', err.message);
    }
  }

  if (event.type === 'invoice.upcoming') {
    const invoice = event.data.object;
    const customerEmail = invoice.customer_email;
    const customerId = invoice.customer;
  
    try {
      const userSnap = await db.collection('users').where('email', '==', customerEmail).get();
      if (userSnap.empty) return res.status(200).send('User not found');
  
      const userDoc = userSnap.docs[0];
      const userRef = userDoc.ref;
      const userData = userDoc.data();
  
      const currentCredits = userData.credits || 0;
  
      if (currentCredits > 0) {
        // Apply a 100% off invoice item for the upcoming invoice
        await stripe.invoiceItems.create({
          customer: customerId,
          amount: -invoice.amount_due, // subtract full amount
          currency: invoice.currency,
          description: 'Referral credit applied',
          invoice: invoice.id,
        });
  
        // Subtract 1 credit in Firestore
        await userRef.update({
          credits: currentCredits - 1,
        });
  
        console.log(`✅ Applied referral credit for ${customerEmail}, new credits: ${currentCredits - 1}`);
      }
    } catch (err) {
      console.error('❌ Error applying referral credit:', err.message);
    }
  }

  res.status(200).json({ received: true });
}