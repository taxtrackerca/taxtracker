import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { referralCode } = req.body;

  try {
    const snapshot = await db
      .collection('users')
      .where('referralCode', '==', referralCode)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ uid: null });
    }

    const referrerDoc = snapshot.docs[0];
    return res.status(200).json({ uid: referrerDoc.id });
  } catch (err) {
    console.error('Error fetching referrer UID:', err);
    return res.status(500).json({ error: 'Failed to fetch referrer UID' });
  }
}