// pages/admin/support/[id].jsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

export default function SupportThreadPage() {
  const router = useRouter();
  const { id } = router.query;
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchThread = async () => {
      const docRef = doc(db, 'supportThreads', id);
      const threadSnap = await getDoc(docRef);
      if (threadSnap.exists()) {
        setThread({ id: threadSnap.id, ...threadSnap.data() });
      }
    };

    const q = query(collection(db, 'supportThreads', id, 'messages'), orderBy('timestamp'));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setLoading(false);
    });

    fetchThread();
    return () => unsub();
  }, [id]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    const ref = doc(db, 'supportThreads', id);
    await addDoc(collection(ref, 'messages'), {
      senderId: 'admin',
      senderRole: 'admin',
      content: reply,
      timestamp: serverTimestamp(),
    });
    await updateDoc(ref, { lastUpdated: serverTimestamp() });
    setReply('');
  };

  const markResolved = async () => {
    const ref = doc(db, 'supportThreads', id);
    await updateDoc(ref, { status: 'resolved' });
    router.push('/admin/support');
  };

  if (!thread) return <p className="p-4">Loading thread...</p>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-2">🧵 {thread.subject}</h2>
      <p className="text-sm text-gray-500 mb-4">User: {thread.email}</p>

      <div className="bg-white border rounded p-4 space-y-4 mb-4">
        {loading ? <p>Loading messages...</p> : (
          messages.map((msg) => (
            <div key={msg.id} className={`p-2 rounded ${msg.senderRole === 'admin' ? 'bg-blue-50 text-right' : 'bg-gray-100'}`}>
              <p className="text-sm whitespace-pre-line">{msg.content}</p>
              <p className="text-xs text-gray-500 mt-1">
                {msg.senderRole === 'admin' ? 'You' : 'User'}
              </p>
            </div>
          ))
        )}
      </div>

      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        rows={3}
        placeholder="Type your reply..."
        className="w-full p-2 border rounded mb-2"
      />

      <div className="flex gap-2">
        <button
          onClick={handleReply}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
        >
          Send Reply
        </button>
        <button
          onClick={markResolved}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500"
        >
          Mark as Resolved
        </button>
      </div>
    </div>
  );
}
