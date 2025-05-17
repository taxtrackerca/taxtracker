// components/AdminSupportTabs.jsx
import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function AdminSupportTabs() {
  const [activeTab, setActiveTab] = useState('location');
  const [locationRequests, setLocationRequests] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      const locSnap = await getDocs(collection(db, 'supportRequests'));
      const supportSnap = await getDocs(collection(db, 'supportTickets'));

      setLocationRequests(
        locSnap.docs
          .filter(doc => !doc.data().resolved)
          .map(doc => ({ id: doc.id, ...doc.data() }))
      );

      setSupportTickets(
        supportSnap.docs
          .filter(doc => !doc.data().resolved)
          .map(doc => ({ id: doc.id, ...doc.data() }))
      );
    };
    fetchRequests();
  }, []);

  const markResolved = async (id, type) => {
    const ref = doc(db, type === 'location' ? 'supportRequests' : 'supportTickets', id);
    await updateDoc(ref, { resolved: true });
    if (type === 'location') {
      setLocationRequests(prev => prev.filter(req => req.id !== id));
    } else {
      setSupportTickets(prev => prev.filter(ticket => ticket.id !== id));
    }
  };

  const renderRequest = (req, type) => (
    <details key={req.id} className="bg-white border rounded p-4 mb-2">
      <summary className="font-semibold cursor-pointer">{req.email}</summary>
      {type === 'location' ? (
        <p className="text-sm text-gray-700">Requested Province: {req.requestedProvince}</p>
      ) : null}
      {req.message && <p className="text-sm text-gray-600 mt-1">Message: {req.message}</p>}
      <button
        onClick={() => markResolved(req.id, type)}
        className="mt-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500"
      >
        Mark Resolved
      </button>
    </details>
  );

  return (
    <div className="bg-white border p-4 rounded shadow mb-10">
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setActiveTab('location')}
          className={`px-4 py-2 rounded ${activeTab === 'location' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Location Requests
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`px-4 py-2 rounded ${activeTab === 'support' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Support Tickets
        </button>
      </div>

      {activeTab === 'location' ? (
        locationRequests.length === 0 ? <p>No location requests.</p> : locationRequests.map(req => renderRequest(req, 'location'))
      ) : (
        supportTickets.length === 0 ? <p>No support tickets.</p> : supportTickets.map(ticket => renderRequest(ticket, 'support'))
      )}
    </div>
  );
}
