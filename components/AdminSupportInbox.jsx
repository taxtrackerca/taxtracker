// components/AdminSupportInbox.jsx
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Link from 'next/link';

export default function AdminSupportInbox() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThreads = async () => {
      const q = query(collection(db, 'supportThreads'), orderBy('lastUpdated', 'desc'));
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setThreads(results);
      setLoading(false);
    };

    fetchThreads();
  }, []);

  const markResolved = async (id) => {
    await updateDoc(doc(db, 'supportThreads', id), { status: 'resolved' });
    setThreads(prev => prev.map(t => t.id === id ? { ...t, status: 'resolved' } : t));
  };

  if (loading) return <p className="p-4">Loading support threads...</p>;
  if (threads.length === 0) return <p className="p-4">No support threads found.</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">📬 Support Threads</h2>
      <ul className="space-y-4">
        {threads.map((thread) => (
          <li key={thread.id} className="border p-4 rounded shadow">
            <p><strong>Subject:</strong> {thread.subject}</p>
            <p><strong>Email:</strong> {thread.email}</p>
            <p><strong>Status:</strong> {thread.status}</p>
            <div className="flex gap-2 mt-2">
              <Link href={`/admin/ticket/${thread.id}`} className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-500">
                View Conversation →
              </Link>
              {thread.status !== 'resolved' && (
                <button
                  onClick={() => markResolved(thread.id)}
                  className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-500"
                >
                  Mark as Resolved
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
