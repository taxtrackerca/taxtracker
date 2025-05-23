// pages/support/thread/[threadId].jsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { auth, db } from '../../../lib/firebase';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';

export default function UserSupportThreadPage() {
  const router = useRouter();
  const { threadId } = router.query;
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!threadId || !user) return;

    const threadRef = doc(db, 'supportThreads', threadId);

    getDoc(threadRef).then((docSnap) => {
      if (!docSnap.exists()) return router.push('/support');
      const data = docSnap.data();
      if (data.userId !== user.uid) return router.push('/support');
      setThread(data);
      setLoading(false);
    });

    const messagesQuery = query(
      collection(db, 'supportThreads', threadId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snap) => {
      const msgs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [threadId, user]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    await addDoc(collection(db, 'supportThreads', threadId, 'messages'), {
      senderId: user.uid,
      senderRole: 'user',
      content: newMessage.trim(),
      timestamp: serverTimestamp(),
    });
    setNewMessage('');
  };

  if (loading) return <p className="p-4">Loading thread...</p>;
  if (!thread) return null;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Support: {thread.subject}</h1>
      <div className="border rounded p-4 space-y-4 bg-white">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg ${msg.senderRole === 'admin' ? 'bg-blue-50' : 'bg-gray-100'}`}
          >
            <p className="text-sm text-gray-600">
              <strong>{msg.senderRole === 'admin' ? 'Admin' : 'You'}</strong> —{' '}
              {msg.timestamp?.toDate?.().toLocaleString?.() || '...'}
            </p>
            <p className="text-gray-800 mt-1 whitespace-pre-line">{msg.content}</p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          rows={4}
          className="w-full p-2 border rounded mb-2"
          placeholder="Type your reply here..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
        >
          Send Reply
        </button>
      </div>
    </div>
  );
}
