// components/AdminSupportTabs.jsx
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { deleteDoc } from 'firebase/firestore'; // ensure this is imported

export default function AdminSupportTabs() {
  const [activeTab, setActiveTab] = useState('location');
  const [locationRequests, setLocationRequests] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [resolved, setResolved] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      const locQuery = query(collection(db, 'supportRequests'), where('resolved', '==', false), orderBy('timestamp', 'desc'));
      const supQuery = query(collection(db, 'supportTickets'), where('resolved', '==', false), orderBy('timestamp', 'desc'));

      const resLocQuery = query(collection(db, 'supportRequests'), where('resolved', '==', true), orderBy('timestamp', 'desc'));
      const resSupQuery = query(collection(db, 'supportTickets'), where('resolved', '==', true), orderBy('timestamp', 'desc'));

      const [locSnap, supSnap, resLocSnap, resSupSnap] = await Promise.all([
        getDocs(locQuery),
        getDocs(supQuery),
        getDocs(resLocQuery),
        getDocs(resSupQuery),
      ]);

      setLocationRequests(locSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'location' })));
      setSupportTickets(supSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'support' })));

      const resolvedCombined = [
        ...resLocSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'location' })),
        ...resSupSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'support' })),
      ];

      setResolved(resolvedCombined);
    };

    fetchRequests();
  }, []);

  const markResolved = async (type, id) => {
    const col = type === 'location' ? 'supportRequests' : 'supportTickets';
    const ref = doc(db, col, id);
    await updateDoc(ref, { resolved: true });

    const docSnap = await getDoc(ref);
    const data = { id: docSnap.id, ...docSnap.data(), type };

    if (type === 'location') {
      setLocationRequests(prev => prev.filter(r => r.id !== id));
    } else {
      setSupportTickets(prev => prev.filter(r => r.id !== id));
    }

    setResolved(prev => [...prev, data]);
  };

  const deleteResolved = async (type, id) => {
    const col = type === 'location' ? 'supportRequests' : 'supportTickets';
    await deleteDoc(doc(db, col, id));
    setResolved(prev => prev.filter(r => r.id !== id));
  };

  const renderRequests = (list, type) =>
    list.map((req) => (
      <details key={req.id} className="border rounded p-3 mb-3 bg-white">
        <summary className="cursor-pointer font-medium">
          {req.email} - {new Date(req.timestamp?.toDate()).toLocaleDateString()}
        </summary>

        {req.type === 'location' && (
          <>
            <p className="text-sm mt-2"><strong>Requested Province:</strong> {req.requestedProvince}</p>
            {req.message && <p className="text-sm text-gray-700 mt-1">{req.message}</p>}
          </>
        )}

        {req.type === 'support' && (
          <p className="text-sm mt-2 text-gray-700">{req.message}</p>
        )}

        <div className="mt-3 flex gap-2">
          {type === 'resolved' ? (
            <button
              onClick={() => deleteResolved(req.type, req.id)}
              className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500"
            >
              Delete
            </button>
          ) : (
            <button
              onClick={() => markResolved(req.type, req.id)}
              className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500"
            >
              Mark Resolved
            </button>
          )}
        </div>
      </details>
    ));

  return (
    <div className="mb-10">
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('location')} className={`px-4 py-2 rounded ${activeTab === 'location' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
          Location Requests ({locationRequests.length})
        </button>
        <button onClick={() => setActiveTab('support')} className={`px-4 py-2 rounded ${activeTab === 'support' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
          Support Tickets ({supportTickets.length})
        </button>
        <button onClick={() => setActiveTab('resolved')} className={`px-4 py-2 rounded ${activeTab === 'resolved' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
          Resolved
        </button>
      </div>

      {activeTab === 'location' && renderRequests(locationRequests, 'location')}
      {activeTab === 'support' && renderRequests(supportTickets, 'support')}
      {activeTab === 'resolved' && (
        resolved.length === 0
          ? <p>No resolved requests yet.</p>
          : renderRequests(resolved, 'resolved')
      )}

    </div>
  );
}
