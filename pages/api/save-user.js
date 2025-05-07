// pages/api/save-user.js
import * as admin from 'firebase-admin';

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

  const { uid, email } = req.body;

  try {
    await db.collection('users').doc(uid).set({ email }, { merge: true });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error saving user:', err);
    res.status(500).json({ error: 'Failed to save user.' });
  }
}