import { buffer } from 'micro';
import * as admin from 'firebase-admin';

export const config = {
  api: {
    bodyParser: false,
  },
};

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
      const snap = await db.collection('users').where('email', '==', customerEmail).get();
      if (snap.empty) {
        console.log("❌ No user found.");
        return res.status(200).send('No user found');
      }

      const doc = snap.docs[0];
      console.log("✅ Found user doc:", doc.id);

      return res.status(200).send('Firestore read worked');
    } catch (err) {
      console.error("❌ Firestore read failed:", err.message);
      return res.status(500).send('Firestore error');
    }
  }

  return res.status(200).send('Event processed');
}