import { buffer } from 'micro';
import * as admin from 'firebase-admin';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Firebase Admin init
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
    event = JSON.parse(buf.toString());
    console.log("✅ Event received:", event.type);
  } catch (err) {
    console.error("❌ JSON parse error:", err.message);
    return res.status(400).send('Invalid JSON');
  }

  if (event.type === 'invoice.paid') {
    const customerEmail = event?.data?.object?.customer_email;
    console.log("📬 invoice.paid for:", customerEmail);

    if (!customerEmail) return res.status(400).send('Missing email');

    try {
      const userSnap = await db.collection('users').where('email', '==', customerEmail).get();

      if (userSnap.empty) {
        console.log("❌ No user found for email");
        return res.status(200).send('User not found');
      }

      const userDoc = userSnap.docs[0];
      const userData = userDoc.data();

      console.log("🔍 Found user:", userDoc.id);

      // Check if eligible for referral credit
      if (userData.referredBy && !userData.referralRewarded) {
        const referrerRef = db.collection('users').doc(userData.referredBy);
        const referrerDoc = await referrerRef.get();

        if (referrerDoc.exists) {
          const currentCredits = referrerDoc.data().credits || 0;
          await referrerRef.update({ credits: currentCredits + 1 });
          await userDoc.ref.update({ referralRewarded: true });

          console.log(`🎉 Added 1 credit to ${userData.referredBy}`);
        }
      }

      return res.status(200).send('Referral logic complete');
    } catch (err) {
      console.error("❌ Firestore error:", err.message);
      return res.status(500).send('Error processing referral');
    }
  }

  return res.status(200).send('Event processed');
}