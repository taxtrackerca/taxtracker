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
    <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4 rounded space-y-4">
      {messages.map((msg) => (
        <div key={msg.id} className="space-y-1">
          <h3 className="font-semibold text-yellow-800">{msg.title}</h3>
          <p className="text-yellow-700 text-sm">{msg.content}</p>
          {msg.requestReply && (
            <a
              href="/account#support-form"
              className="inline-block mt-2 text-sm text-blue-700 underline hover:text-blue-900"
            >
              Reply to Support
            </a>
          )}
          <button
            onClick={() => handleAcknowledge(msg.id)}
            className="text-sm text-yellow-700 underline hover:text-yellow-900"
          >
            Acknowledge
          </button>
        </div>
      ))}
    </div>
  );
}

export default DashboardMessages;