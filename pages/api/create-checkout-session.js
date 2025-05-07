// pages/api/create-checkout-session.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { customerEmail, firebaseUid } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: 'price_1RKyanGbcqZ6lOpJHtAuXFQp', // Replace with your actual price ID
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      subscription_data: {
        trial_period_days: 30,
        metadata: {
          firebaseUid: firebaseUid, // now properly passed
        },
      },
      success_url: `${req.headers.origin}/verify-email?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/signup`,
    });

    console.log('✅ Stripe session created:', session.url);

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe session creation error:', err);
    res.status(500).json({ error: err.message });
  }
}