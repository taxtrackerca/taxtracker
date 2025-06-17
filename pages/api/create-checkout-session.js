import Stripe from 'stripe';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ✅ Init Firebase Admin SDK (only once)
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
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { customerEmail, firebaseUid } = req.body;

  try {
    // ✅ Step 1: Check if customer with email already exists
    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    const customer = existingCustomers.data[0]
      ? existingCustomers.data[0]
      : await stripe.customers.create({
          email: customerEmail,
          metadata: { firebaseUid },
        });

    // ✅ Step 2: Save Stripe Customer ID to Firestore
    await db.collection('users').doc(firebaseUid).set(
      {
        stripeCustomerId: customer.id,
      },
      { merge: true }
    );

    // ✅ Step 3: Add to MailerLite
    try {
      await fetch(`${req.headers.origin}/api/add-subscriber`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: customerEmail, name: '' }),
      });
      console.log(`✅ Added ${customerEmail} to MailerLite`);
    } catch (mailError) {
      console.warn(`⚠️ MailerLite add failed:`, mailError);
    }

    // ✅ Step 4: Create checkout sessio
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: customer.id,
      line_items: [
        {
          price: 'price_1RKyanGbcqZ6lOpJHtAuXFQp',
          quantity: 1,
        },
      ],

      subscription_data: {
        trial_period_days: 23
      },
      
      success_url: `http://localhost:3000/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/signup`,
    });

    console.log('✅ Stripe session created:', session.url);
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe session creation error:', err);
    res.status(500).json({ error: err.message });
  }
}