// lib/checkTrialEligibility.js
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function isTrialBlocked(email) {
  const ref = doc(db, 'trialBlocks', email.toLowerCase());
  const snap = await getDoc(ref);
  return snap.exists();
}