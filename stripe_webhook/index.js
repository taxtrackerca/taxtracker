const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Stripe = require("stripe");


admin.initializeApp();
const db = admin.firestore();
const stripe = new Stripe(functions.config().stripe.secret, {
  apiVersion: "2023-10-16",
});

// Helper to verify raw body signature
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = functions.config().stripe.webhook;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    console.log(`✅ Stripe event received: ${event.type}`);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Respond immediately to Stripe
  res.status(200).send("Webhook received");

  // Continue processing
  if (event.type === "invoice.paid") {
    try {
      const invoice = event.data.object;
      if (invoice.amount_paid === 0) {
        console.log("🟡 Skipping $0 invoice");
        return;
      }

      const customerId = invoice.customer;
      const customer = await stripe.customers.retrieve(customerId);
      const firebaseUid = customer.metadata && customer.metadata.firebaseUid;

      if (!firebaseUid) {
        console.log("❌ No UID in metadata");
        return;
      }

      const userRef = db.collection("users").doc(firebaseUid);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        console.log("❌ User doc not found");
        return;
      }

      const userData = userSnap.data();
      const referredBy = userData && userData.referredBy;
      const referralRewarded = userData && userData.referralRewarded || false;

      if (referredBy && !referralRewarded) {
        const referrerRef = db.collection("users").doc(referredBy);
        const referrerSnap = await referrerRef.get();

        if (referrerSnap.exists) {
          const currentCredits = referrerSnap.data().credits || 0;
          await referrerRef.update({credits: currentCredits + 1});
          await userRef.set({referralRewarded: true}, {merge: true});

          console.log(`🎉 1 credit rewarded to ${referredBy}`);
        } else {
          console.log("⚠️ Referrer not found");
        }
      } else {
        console.log("ℹ️ Already rewarded or no referral");
      }
    } catch (err) {
      console.error("❌ invoice.paid handler failed:", err.message);
    }
  }
});
