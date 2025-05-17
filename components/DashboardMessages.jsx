import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

function DashboardMessages() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const fetchMessages = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const now = Timestamp.now();
      const messagesRef = collection(db, 'messages');
      const q = query(messagesRef, where('showUntil', '>=', now));
      const snap = await getDocs(q);

      const filtered = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(msg => !msg.userId || msg.userId === user.uid);

      setMessages(filtered);
    };

    fetchMessages();
  }, []);

  if (messages.length === 0) return null;

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4 rounded">
      {messages.map((msg) => (
        <div key={msg.id} className="mb-2">
          <h3 className="font-semibold text-yellow-800">{msg.title}</h3>
          <p className="text-yellow-700 text-sm">{msg.content}</p>
        </div>
      ))}
    </div>
  );
}

export default DashboardMessages;
