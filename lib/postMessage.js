// lib/postMessage.js
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const postMessage = async ({ title, content, showUntil, userId = null }) => {
  try {
    await addDoc(collection(db, 'messages'), {
      title,
      content,
      showUntil: new Date(showUntil),
      userId, // null = global message
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error posting message:', error);
  }
};