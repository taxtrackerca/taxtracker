// pages/admin/support/index.jsx
import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@lib/firebase';
import Link from 'next/link';

export default function AdminSupportThreadInbox() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThreads = async () => {
      const q = query(collection(db, 'supportThreads'), orderBy('lastUpdated', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setThreads(data);
      setLoading(false);
    };

    fetchThreads();
  }, []);

  if (loading) return <p className="p-4">Loading support threads...</p>;
  if (threads.length === 0) return <p className="p-4">No support tickets found.</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">📬 Support Tickets</h1>
      <ul className="space-y-4">
        {threads.map((thread) => (
          <li key={thread.id} className="border p-4 rounded shadow">
            <p><strong>Subject:</strong> {thread.subject}</p>
            <p><strong>User:</strong> {thread.email}</p>
            <p><strong>Status:</strong> {thread.status}</p>
            <p><strong>Last Updated:</strong> {thread.lastUpdated?.toDate?.().toLocaleString?.()}</p>
            <Link
              href={`/admin/support/${thread.id}`}
              className="inline-block mt-2 bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-500"
            >
              View Thread
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
