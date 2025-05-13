import { buffer } from 'micro';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const buf = await buffer(req);

  try {
    const event = JSON.parse(buf.toString());

    console.log("✅ Webhook received event type:", event.type);

    return res.status(200).send(`Event ${event.type} processed`);
  } catch (err) {
    console.error("❌ JSON parse error:", err.message);
    return res.status(400).send('Invalid payload');
  }
}