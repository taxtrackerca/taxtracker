// lib/logEvent.js
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const logEvent = async ({ userId, email, type, details = {}, reason = '' }) => {
  try {
    await addDoc(collection(db, 'logs'), {
      userId,
      email,
      type, // e.g., 'province_change', 'account_deletion', 'manual_credit'
      reason,
      details,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error logging event:', error);
  }
};