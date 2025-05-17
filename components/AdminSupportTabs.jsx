// components/AdminSupportTabs.jsx
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function AdminSupportTabs() {
  const [activeTab, setActiveTab] = useState('location');
  const [locationRequests, setLocationRequests] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [resolved, setResolved] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      const locQuery = query(collection(db, 'supportRequests'), where('resolved', '==', false), orderBy('timestamp', 'desc'));
      const supQuery = query(collection(db, 'supportTickets'), where('resolved', '==', false), orderBy('timestamp', 'desc'));
      const resQuery = query(collectionGroup(db, 'support'), where('resolved', '==', true), orderBy('timestamp', 'desc'));

      const [locSnap, supSnap, resSnap] = await Promise.all([
        getDocs(locQuery),
        getDocs(supQuery),
        getDocs(resQuery),
      ]);

      setLocationRequests(locSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'location' })));
      setSupportTickets(supSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'support' })));
      setResolved(resSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchRequests();
  }, []);

  const markResolved = async (type, id) => {
    const col = type === 'location' ? 'supportRequests' : 'supportTickets';
    await updateDoc(doc(db, col, id), { resolved: true });
    if (type === 'location') {
      setLocationRequests(prev => prev.filter(r => r.id !== id));
    } else {
      setSupportTickets(prev => prev.filter(r => r.id !== id));
    }
    setResolved(prev => [...prev, { ...resolved.find(r => r.id === id) }]);
  };

  const renderRequests = (list) => (
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
        <button onClick={() => markResolved(req.type, req.id)} className="text-sm mt-3 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500">
          Mark Resolved
        </button>
      </details>
    ))
  );

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

      {activeTab === 'location' && renderRequests(locationRequests)}
      {activeTab === 'support' && renderRequests(supportTickets)}
      {activeTab === 'resolved' && (
        <div>
          {resolved.length === 0 ? <p>No resolved requests yet.</p> : renderRequests(resolved)}
        </div>
      )}
    </div>
  );
}
