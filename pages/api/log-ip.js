// /pages/api/log-ip.js
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
  });
}

const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
  const { email, eventType, uid } = req.body;
  const timestamp = new Date();

  if (!email || !eventType) {
    return res.status(400).json({ error: 'Missing email or eventType' });
  }

  // ✅ Log event to ipLogs
  await db.collection('ipLogs').add({
    email,
    uid: uid || null,
    ipAddress: ip,
    eventType,
    timestamp,
  });

  // ✅ Detect if this IP has been used before by another email
  if (eventType === 'signup') {
    const recent = await db.collection('ipLogs')
      .where('ipAddress', '==', ip)
      .where('eventType', '==', 'signup')
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();

    const matches = recent.docs.filter(doc => doc.data().email !== email);

    if (matches.length > 0) {
      const first = matches[0].data();

      await db.collection('adminAlerts').add({
        type: 'duplicateTrial_IP',
        ipAddress: ip,
        originalEmail: first.email,
        newEmail: email,
        timestamp,
        resolved: false
      });
    }
  }

  res.status(200).json({ status: 'IP logged' });
}