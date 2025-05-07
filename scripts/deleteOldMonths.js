// scripts/deleteOldMonths.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { firebaseConfig } from '../lib/firebase'; // Adjust path if needed

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteOldMonthDocs(userId) {
  const monthsRef = collection(db, 'users', userId, 'months');
  const snapshot = await getDocs(monthsRef);

  for (const document of snapshot.docs) {
    const id = document.id;
    if (!/\d{4}/.test(id)) {
      console.log(`Deleting old month doc: ${id}`);
      await deleteDoc(doc(db, 'users', userId, 'months', id));
    }
  }

  console.log('Old documents cleanup complete.');
}

// Replace with your actual user ID (can log it from auth.currentUser.uid)
const yourUserId = 'taxtrackerca';
deleteOldMonthDocs(yourUserId);