// lib/postMessage.js
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

export const postMessage = async ({ title, content, userEmail = null }) => {
  let userId = null;

  if (userEmail) {
    const q = query(collection(db, 'users'), where('email', '==', userEmail));
    const snap = await getDocs(q);
    if (!snap.empty) {
      userId = snap.docs[0].id;
    } else {
      throw new Error('User not found with that email.');
    }
  }

  await addDoc(collection(db, 'messages'), {
    title,
    content,
    userId, // null = global
    timestamp: serverTimestamp(),
  });
};