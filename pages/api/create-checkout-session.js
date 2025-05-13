import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { customerEmail, firebaseUid } = req.body;

  try {
    // ✅ STEP 1: Create the Stripe customer with metadata
    const customer = await stripe.customers.create({
      email: customerEmail,
      metadata: {
        firebaseUid, // ✅ store Firebase UID directly on the customer
      },
    });

    // ✅ STEP 2: Create the session and pass the customer ID
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: customer.id, // ✅ pass customer ID instead of email
      line_items: [
        {
          price: 'price_1RKyanGbcqZ6lOpJHtAuXFQp',
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 30,
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