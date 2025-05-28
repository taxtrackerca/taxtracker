import {onRequest} from "firebase-functions/v2/https";
import {setGlobalOptions} from "firebase-functions/v2/options";
import Stripe from "stripe";
import admin from "firebase-admin";

// ✅ Setup secrets and region
setGlobalOptions({
  region: "us-central1",
  secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
});

// ✅ Init Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// ✅ Export webhook function directly
export const stripeWebhook = onRequest({rawRequest: true}, async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });

  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
        req.rawBody, // ✅ Use req.rawBody, not req.body
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("❌ Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`✅ Received event: ${event.type}`);

  // ✅ Example: invoice.paid handler
  if (event.type === "invoice.paid") {
    const invoice = event.data.object;
    const customer = await stripe.customers.retrieve(invoice.customer);
    const uid = customer.metadata?.firebaseUid;

    if (!uid) {
      console.warn("⚠️ No firebaseUid found");
      return res.status(200).send("No action required");
    }

    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      console.warn("⚠️ User not found");
      return res.status(200).send("No action required");
    }

    const userData = userSnap.data();
    if (userData.referredBy && !userData.referralRewarded) {
      const referrerRef = db.collection("users").doc(userData.referredBy);
      const referrerSnap = await referrerRef.get();

      if (referrerSnap.exists) {
        const credits = referrerSnap.data().credits || 0;
        await referrerRef.update({credits: credits + 1});
        await userRef.update({referralRewarded: true});
        console.log(`🎉 Credit granted to referrer: ${userData.referredBy}`);
      }
    }
  }

  res.status(200).send("Webhook processed");
});
