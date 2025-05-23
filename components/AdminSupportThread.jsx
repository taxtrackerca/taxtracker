// components/AdminSupportThread.jsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc, collection, addDoc, serverTimestamp, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';

export default function AdminSupportThread() {
  const router = useRouter();
  const { id } = router.query;
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (!id) return;

    const threadRef = doc(db, 'supportThreads', id);
    const unsubscribeThread = onSnapshot(threadRef, (snap) => {
      if (snap.exists()) {
        setThread({ id: snap.id, ...snap.data() });
      }
    });

    const messagesRef = collection(db, 'supportThreads', id, 'messages');
    const unsubscribeMessages = onSnapshot(messagesRef, (snap) => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      msgs.sort((a, b) => a.timestamp?.seconds - b.timestamp?.seconds);
      setMessages(msgs);
      setLoading(false);
    });

    return () => {
      unsubscribeThread();
      unsubscribeMessages();
    };
  }, [id]);

  const sendReply = async () => {
    if (!reply.trim()) return;
    const user = auth.currentUser;
    if (!user) return;

    await addDoc(collection(db, 'supportThreads', id, 'messages'), {
      senderId: user.uid,
      senderRole: 'admin',
      content: reply,
      timestamp: serverTimestamp(),
    });

    await updateDoc(doc(db, 'supportThreads', id), {
      lastUpdated: serverTimestamp(),
      status: 'open',
    });

    setReply('');
  };

  const markResolved = async () => {
    await updateDoc(doc(db, 'supportThreads', id), { status: 'resolved' });
    setStatusMsg('Thread marked as resolved.');
  };

  if (loading) return <p className="p-4">Loading conversation...</p>;
  if (!thread) return <p className="p-4">Thread not found.</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-2">🗨️ Support Thread</h2>
      <p><strong>Subject:</strong> {thread.subject}</p>
      <p><strong>Email:</strong> {thread.email}</p>
      <p><strong>Status:</strong> {thread.status}</p>

      <div className="my-4 border rounded bg-white p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded shadow ${msg.senderRole === 'admin' ? 'bg-blue-50' : 'bg-gray-100'}`}
          >
            <p className="text-sm text-gray-600">
              {msg.senderRole === 'admin' ? 'Admin' : 'User'} ·{' '}
              {new Date(msg.timestamp?.seconds * 1000).toLocaleString()}
            </p>
            <p className="text-gray-800 whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
      </div>

      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        rows={4}
        className="w-full border p-2 rounded mb-2"
        placeholder="Write your reply..."
      ></textarea>

      <div className="flex gap-2">
        <button
          onClick={sendReply}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
        >
          Send Reply
        </button>
        {thread.status !== 'resolved' && (
          <button
            onClick={markResolved}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500"
          >
            Mark as Resolved
          </button>
        )}
      </div>

      {statusMsg && <p className="text-green-700 mt-2 text-sm">{statusMsg}</p>}
    </div>
  );
}
