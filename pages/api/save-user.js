import * as admin from 'firebase-admin';
import { nanoid } from 'nanoid';

if (!admin.apps.length) {
  console.log('DEBUG KEY START');
  console.log(process.env.FIREBASE_PRIVATE_KEY);
  console.log('DEBUG KEY END');
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
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { uid, email, referredBy } = req.body;

  try {
    const referralCode = nanoid(6);

    await db.collection('users').doc(uid).set(
      {
        email,
        signupTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        referralCode,             // user's unique code to share
        referredBy: referredBy || null, // optional if they were referred
        credits: 0,               // for tracking future free months
      },
      { merge: true }
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error saving user:', err);
    res.status(500).json({ error: 'Failed to save user.' });
  }
}