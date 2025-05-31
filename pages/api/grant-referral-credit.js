import { db, admin } from '../../lib/firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { referredUid } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid auth token' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const adminSnap = await db.collection('users').doc(decoded.uid).get();
    const adminData = adminSnap.data();

    if (!adminData?.isAdmin) {
      return res.status(403).json({ error: 'Admin privileges required' });
    }

    // ✅ Proceed with referral credit logic
    if (!referredUid) {
      return res.status(400).json({ error: 'Missing referredUid' });
    }

    const referredRef = db.collection('users').doc(referredUid);
    const referredSnap = await referredRef.get();

    if (!referredSnap.exists) {
      return res.status(404).json({ error: 'Referred user not found' });
    }

    const referredData = referredSnap.data();

    if (referredData.referralCreditGranted) {
      return res.status(400).json({ error: 'Referral credit already granted' });
    }

    const referrerId = referredData.referredBy;
    if (!referrerId) {
      return res.status(400).json({ error: 'Missing referredBy field' });
    }

    const referrerRef = db.collection('users').doc(referrerId);
    const referrerSnap = await referrerRef.get();

    if (!referrerSnap.exists) {
      return res.status(404).json({ error: 'Referrer not found' });
    }

    const referrerData = referrerSnap.data();
    const referrerStripeId = referrerData.stripeCustomerId;

    if (!referrerStripeId) {
      return res.status(400).json({ error: 'Referrer missing Stripe ID' });
    }

    const tx = await stripe.customers.createBalanceTransaction(referrerStripeId, {
      amount: -495,
      currency: 'cad',
      description: `Referral reward: ${referredData.email} paid`,
    });

    await referredRef.update({ referralCreditGranted: true });

    return res.status(200).json({ success: true, txId: tx.id });

  } catch (err) {
    console.error('❌ Referral credit error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}