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

  res.status(200).send('Received');

  if (event.type === 'invoice.paid') {
    try {
      const invoice = event.data.object;

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

      if (referredBy && !referralRewarded) {
        const referrerRef = db.collection('users').doc(referredBy);
        const referrerSnap = await referrerRef.get();

        if (!referrerSnap.exists) {
          console.log("⚠️ Referrer not found:", referredBy);
          return;
        }

        // ✅ Add a referral log entry
        await db
          .collection('users')
          .doc(referredBy)
          .collection('referrals')
          .doc(firebaseUid)
          .set({
            credited: true,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });

        // ✅ Increment totalCredits
        await referrerRef.set(
          {
            totalCredits: admin.firestore.FieldValue.increment(1),
          },
          { merge: true }
        );

        // ✅ Mark this user as rewarded
        await userRef.set({ referralRewarded: true }, { merge: true });

        console.log(`🎉 1 credit rewarded to ${referredBy} for referred user ${firebaseUid}`);
      } else {
        console.log("ℹ️ No referral reward needed or already rewarded.");
      }
    } catch (err) {
      console.error("❌ invoice.paid processing error:", err.message);
    }
  }
}