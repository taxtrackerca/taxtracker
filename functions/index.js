const functions = require('firebase-functions');
functions.config().stripe = {
  secret_key: process.env.STRIPE_SECRET_KEY
};
const admin = require('firebase-admin');
const Stripe = require('stripe');
const { buffer } = require('micro');

admin.initializeApp();
const db = admin.firestore();

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2023-10-16',
});

exports.stripeWebhook = functions
  .region('us-central1')
  .runWith({ secrets: ['STRIPE_SECRET_KEY'] })
  .https.onRequest(async (req, res) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    let event;
    try {
      const buf = await buffer(req);
      event = JSON.parse(buf.toString());
    } catch (err) {
      console.error('❌ Error parsing webhook:', err.message);
      return res.status(400).send('Invalid payload');
    }

    if (event.type === 'invoice.paid') {
      try {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const customer = await stripe.customers.retrieve(customerId);
        const firebaseUid = customer.metadata?.firebaseUid;

        if (!firebaseUid) {
          console.log('⚠️ No firebaseUid in metadata');
          return res.status(200).send('No UID');
        }

        const userRef = db.collection('users').doc(firebaseUid);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
          console.log("❌ User not found:", firebaseUid);
          return res.status(200).send('No user');
        }

        const userData = userSnap.data();

        if (userData.referredBy && !userData.referralRewarded) {
          const referrerRef = db.collection('users').doc(userData.referredBy);
          const referrerSnap = await referrerRef.get();

          if (referrerSnap.exists) {
            const credits = referrerSnap.data().credits || 0;
            await referrerRef.update({ credits: credits + 1 });
            await userRef.update({ referralRewarded: true });

            console.log(`🎉 Credit given to ${userData.referredBy}`);
          }
        }

        return res.status(200).send('Processed referral');
      } catch (err) {
        console.error("❌ Error processing webhook:", err.message);
        return res.status(500).send('Webhook failed');
      }
    }

    return res.status(200).send('Event received');
  });