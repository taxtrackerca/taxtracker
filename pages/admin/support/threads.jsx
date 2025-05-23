// pages/support/threads.jsx
import { useEffect, useState } from 'react';
import { auth, db } from 'lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';

export default function SupportThreadsPage() {
  const [threads, setThreads] = useState([]);

  useEffect(() => {
    const fetchThreads = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const q = query(collection(db, 'supportThreads'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setThreads(data);
    };

    fetchThreads();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">📂 Your Support Threads</h1>
      {threads.length === 0 ? (
        <p>You haven't started any support threads yet.</p>
      ) : (
        <ul className="space-y-4">
          {threads.map((thread) => (
            <li key={thread.id} className="border p-4 rounded shadow">
              <h2 className="text-lg font-semibold">{thread.subject}</h2>
              <p className="text-sm text-gray-600">Status: {thread.status}</p>
              <Link href={`/support/thread/${thread.id}`} className="text-blue-600 underline">
                View Conversation →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}