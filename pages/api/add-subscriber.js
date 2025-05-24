// pages/api/add-subscriber.js
const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
const MAILERLITE_GROUP_ID = process.env.MAILERLITE_GROUP_ID;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, name } = req.body;

  try {
    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MAILERLITE_API_KEY}`,
      },
      body: JSON.stringify({
        email,
        fields: { name },
        groups: [MAILERLITE_GROUP_ID],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(400).json({ error: error.message || 'MailerLite API error' });
    }

    const result = await response.json();
    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error('MailerLite error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}