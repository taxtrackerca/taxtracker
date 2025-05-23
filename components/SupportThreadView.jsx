// components/SupportThreadView.jsx
import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

export default function SupportThreadView({ threadId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  useEffect(() => {
    if (!threadId) return;

    const fetchThread = async () => {
      const threadDoc = await getDoc(doc(db, 'supportThreads', threadId));
      if (threadDoc.exists()) {
        setThread(threadDoc.data());
      }
    };

    const q = query(
      collection(db, 'supportThreads', threadId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setLoading(false);
    });

    fetchThread();

    return () => unsubscribe();
  }, [threadId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    if (!user) return;

    await addDoc(collection(db, 'supportThreads', threadId, 'messages'), {
      content: newMessage,
      senderId: user.uid,
      senderRole: 'user', // or 'admin' based on context
      timestamp: serverTimestamp(),
    });

    setNewMessage('');
  };

  if (loading) return <p>Loading conversation...</p>;

  return (
    <div className="bg-white p-4 border rounded shadow max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Support Conversation</h2>
      <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg text-sm w-fit max-w-[80%] ${
              msg.senderRole === 'user'
                ? 'bg-blue-100 ml-auto text-right'
                : 'bg-gray-100 mr-auto text-left'
            }`}
          >
            <p>{msg.content}</p>
            <p className="text-gray-500 text-xs mt-1">
              {msg.senderRole === 'user' ? 'You' : 'Support'}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your reply..."
          className="flex-grow border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
        >
          Send
        </button>
      </form>
    </div>
  );
}
