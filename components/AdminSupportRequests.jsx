// components/AdminSupportRequests.jsx
import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function AdminSupportRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      const q = query(collection(db, 'supportRequests'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      const items = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setRequests(items);
      setLoading(false);
    };

    fetchRequests();
  }, []);

  const handleResolve = async (id) => {
    await updateDoc(doc(db, 'supportRequests', id), { resolved: true });
    setRequests(prev => prev.map(r => r.id === id ? { ...r, resolved: true } : r));
  };

  if (loading) return <p className="text-gray-600">Loading requests...</p>;

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Support Requests (Province Change)</h2>
      {requests.length === 0 ? (
        <p className="text-gray-500">No requests found.</p>
      ) : (
        <ul className="space-y-4">
          {requests.map((req) => (
            <li key={req.id} className={`p-4 border rounded ${req.resolved ? 'bg-gray-100' : 'bg-yellow-50'}`}>
              <p><strong>Email:</strong> {req.email}</p>
              <p><strong>Requested Province:</strong> {req.requestedProvince}</p>
              <p><strong>Message:</strong> {req.message || 'N/A'}</p>
              <p className="text-sm text-gray-500 mt-1">Submitted: {new Date(req.timestamp?.toDate?.()).toLocaleString()}</p>
              {!req.resolved && (
                <button
                  onClick={() => handleResolve(req.id)}
                  className="mt-2 inline-block bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded"
                >
                  Mark as Resolved
                </button>
              )}
              {req.resolved && <p className="mt-2 text-green-600 font-medium">✔ Resolved</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
