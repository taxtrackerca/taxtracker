// Firebase functions
import functions from 'firebase-functions';
import admin from 'firebase-admin';
import fetch from 'node-fetch';

admin.initializeApp();
const db = admin.firestore();

const RESEND_API_KEY = functions.config().resend.key;
const FROM_EMAIL = 'reminder@taxtracker.ca';  // or use resend.dev default if not verified yet

export const sendMonthlyReminders = functions.pubsub
  .schedule('0 10 1 * *') // 10 AM Atlantic, 1st of every month
  .timeZone('America/Halifax')
  .onRun(async () => {
    const usersSnapshot = await db.collection('users').get();
    const month = new Date().toLocaleString('default', { month: 'long' });

    for (const doc of usersSnapshot.docs) {
      const user = doc.data();
      if (!user.email) continue;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: user.email,
          subject: `Reminder to log your ${month} income & expenses`,
          html: `
            <p>Hi there,</p>
            <p>This is your monthly reminder to log your income and expenses for <strong>${month}</strong> in <a href="https://taxtracker.ca">TaxTracker.ca</a>.</p>
            <p>Stay organized and tax-ready!</p>
            <p>– The TaxTracker Team</p>
          `,
        }),
      });
    }

    console.log(`✅ Monthly reminders sent for ${month}`);
  });