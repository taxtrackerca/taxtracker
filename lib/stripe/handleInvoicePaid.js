import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

export default async function handleInvoicePaid(event) {
  const invoice = event.data.object;
  const customerId = invoice.customer;
  const amountPaid = invoice.amount_paid;

  if (!customerId || amountPaid === 0) {
    console.log('⚠️ Invoice has no customer or $0 amount — skipping.');
    return;
  }

  const userQuery = await db
    .collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (userQuery.empty) {
    console.log(`❌ No user found for customerId: ${customerId}`);
    return;
  }

  const userDoc = userQuery.docs[0];
  const userRef = userDoc.ref;
  const userData = userDoc.data();

  if (userData.referralStatus === 'paid') {
    console.log('ℹ️ User already marked as paid — skipping.');
    return;
  }

  await userRef.update({
    referralStatus: 'paid',
    firstPaymentDate: new Date(),
  });

  console.log(`✅ User ${userRef.id} marked as paid. firstPaymentDate set.`);
}