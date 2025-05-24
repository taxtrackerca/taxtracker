import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

function DashboardMessages() {
  const [messages, setMessages] = useState([]);
  const [acknowledged, setAcknowledged] = useState([]);

  useEffect(() => {
    const fetchMessages = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;

      const userData = userSnap.data();
      const seen = userData.acknowledgedBroadcasts || [];

      // Initialize field if missing
      if (!userData.acknowledgedBroadcasts) {
        await updateDoc(userRef, { acknowledgedBroadcasts: [] });
      }

      // Load all messages
      const snap = await getDocs(collection(db, 'messages'));
      const filtered = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(msg => (!msg.userId || msg.userId === user.uid) && !seen.includes(msg.id));

      setMessages(filtered);
      setAcknowledged(seen);
    };

    fetchMessages();
  }, []);

  const handleAcknowledge = async (id) => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      acknowledgedBroadcasts: arrayUnion(id)
    });

    setAcknowledged(prev => [...prev, id]);
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  if (messages.length === 0) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 shadow-sm text-sm text-gray-800 space-y-2">
      <h3 className="font-semibold text-yellow-800 text-base">{msg.title}</h3>
      <p className="text-yellow-700 whitespace-pre-line">{msg.content}</p>

      <div className="flex flex-wrap items-center gap-4 mt-2">
        {msg.requestReply && (
          <a
            href="/account#support-form"
            className="text-blue-600 hover:text-blue-800 underline font-medium"
          >
            Reply to Support
          </a>
        )}
        <button
          onClick={() => handleAcknowledge(msg.id)}
          className="text-yellow-700 hover:text-yellow-900 underline font-medium"
        >
          Acknowledge
        </button>
      </div>
    </div>
  );
}

export default DashboardMessages;