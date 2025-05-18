// lib/logIp.js
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

export async function logUserIp(uid, ip) {
  if (!uid || !ip) return;

  await addDoc(collection(db, 'users', uid, 'ips'), {
    ip,
    timestamp: new Date()
  });

  return ip;
}

export async function findOtherUsersWithIp(currentUid, ip) {
  const allUsers = await getDocs(collection(db, 'users'));
  const matches = [];

  for (const userDoc of allUsers.docs) {
    const uid = userDoc.id;
    if (uid === currentUid) continue;

    const ipQuery = query(collection(db, 'users', uid, 'ips'), where('ip', '==', ip));
    const ipDocs = await getDocs(ipQuery);

    if (!ipDocs.empty) {
      matches.push({ uid, email: userDoc.data().email });
    }
  }

  return matches;
}