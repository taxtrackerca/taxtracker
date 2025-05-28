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
  if (event.type === 'invoice.paid') {
    try {
      const invoice = event.data.object;
  
      // Ignore $0 invoices (e.g., free trials)
      if (invoice.amount_paid === 0) {
        console.log("🟡 Skipping $0 invoice");
        return;
      }
  
      const customerId = invoice.customer;
      const customer = await stripe.customers.retrieve(customerId);
      const firebaseUid = customer.metadata?.firebaseUid;
  
      if (!firebaseUid) {
        console.log("❌ No UID found in customer metadata");
        return;
      }
  
      const userRef = db.collection('users').doc(firebaseUid);
      const userSnap = await userRef.get();
  
      if (!userSnap.exists) {
        console.log("❌ User doc not found for UID:", firebaseUid);
        return;
      }
  
      const userData = userSnap.data();
      const referredBy = userData?.referredBy;
      const referralRewarded = userData?.referralRewarded || false;
  
      // ✅ Only reward once, after first real payment
      if (referredBy && !referralRewarded) {
        const referrerRef = db.collection('users').doc(referredBy);
        const referrerSnap = await referrerRef.get();
  
        if (referrerSnap.exists) {
          const currentCredits = referrerSnap.data().credits || 0;
          await referrerRef.update({ credits: currentCredits + 1 });
          await userRef.set({ referralRewarded: true }, { merge: true });
  
          console.log(`🎉 1 credit rewarded to ${referredBy} for referred user ${firebaseUid}`);
        } else {
          console.log("⚠️ Referrer not found:", referredBy);
        }
      } else {
        console.log("ℹ️ No referral reward needed or already rewarded.");
      }
    } catch (err) {
      console.error("❌ invoice.paid processing error:", err.message);
    }
  }
}