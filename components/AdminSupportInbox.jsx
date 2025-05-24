// components/AdminSupportInbox.jsx
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function AdminSupportInbox() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      const snapshot = await getDocs(collection(db, 'supportRequests'));
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(results);
      setLoading(false);
    };

    fetchRequests();
  }, []);

  const handleResolve = async (id) => {
    await deleteDoc(doc(db, 'supportRequests', id));
    setRequests(prev => prev.filter(req => req.id !== id));
  };

  if (loading) return <p className="p-4">Loading support requests...</p>;
  if (requests.length === 0) return <p className="p-4">No open support requests.</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">📬 Support Requests</h2>
      <ul className="space-y-4">
        {requests.map((req) => (
          <li key={req.id} className="border p-4 rounded shadow">
            <p><strong>Email:</strong> {req.email}</p>
            <p><strong>Requested Province:</strong> {req.requestedProvince}</p>
            {req.message && <p><strong>Message:</strong> {req.message}</p>}
            <button
              onClick={() => handleResolve(req.id)}
              className="mt-2 bg-green-600 text-white px-4 py-1 rounded hover:bg-green-500"
            >
              Mark as Resolved
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
