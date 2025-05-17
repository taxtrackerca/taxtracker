import { useState } from 'react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import AdminUserNotes from './AdminUserNotes';

export default function AdminUserLookup() {
  const [query, setQuery] = useState('');
  const [userData, setUserData] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [status, setStatus] = useState('');

  const handleSearch = async () => {
    setStatus('');
    setUserData(null);
    setMonthlyData([]);

    try {
      const userRef = doc(db, 'users', query);
      const userSnap = await getDoc(userRef);

      let userDoc;
      if (userSnap.exists()) {
        userDoc = { id: query, data: userSnap.data() };
      } else {
        const snapshot = await getDocs(collection(db, 'users'));
        const match = snapshot.docs.find(doc => doc.data().email === query);
        if (match) {
          userDoc = { id: match.id, data: match.data() };
        } else {
          setStatus('User not found');
          return;
        }
      }

      setUserData(userDoc);

      const monthsSnap = await getDocs(collection(db, 'users', userDoc.id, 'months'));
      const monthEntries = monthsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMonthlyData(monthEntries);
    } catch (err) {
      console.error(err);
      setStatus('Error fetching user');
    }
  };

  return (
    <div className="bg-white border p-4 rounded shadow mb-10">
      <h2 className="text-xl font-bold mb-4">Search User</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Enter email or UID"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button onClick={handleSearch} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500">
          Search
        </button>
      </div>

      {status && <p className="text-red-600">{status}</p>}

      {userData && (
        <div className="mt-4 space-y-2 text-sm">
          <p><strong>Email:</strong> {userData.data.email}</p>
          <p><strong>Business Name:</strong> {userData.data.businessName || '—'}</p>
          <p><strong>Province:</strong> {userData.data.province || '—'}</p>
          <p><strong>Subscription ID:</strong> {userData.data.subscriptionId || 'None'}</p>
          <p><strong>Credits:</strong> {userData.data.credits || 0}</p>
        </div>
      )}

      {monthlyData.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Monthly Data Snapshot</h3>
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-1 text-left">Month</th>
                <th className="border p-1 text-left">Income</th>
                <th className="border p-1 text-left">Estimated Tax</th>
                <th className="border p-1 text-left">GST Collected</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((month) => (
                <tr key={month.id}>
                  <td className="border p-1">{month.id}</td>
                  <td className="border p-1">${parseFloat(month.income || 0).toFixed(2)}</td>
                  <td className="border p-1">${parseFloat(month.estimatedTaxThisMonth || 0).toFixed(2)}</td>
                  <td className="border p-1">${parseFloat(month.gstCollected || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {userData && (
        <>
          <div className="mt-4 space-y-2 text-sm">
            <p><strong>Email:</strong> {userData.data.email}</p>
            <p><strong>Business Name:</strong> {userData.data.businessName || '—'}</p>
            <p><strong>Province:</strong> {userData.data.province || '—'}</p>
            <p><strong>Subscription ID:</strong> {userData.data.subscriptionId || 'None'}</p>
            <p><strong>Credits:</strong> {userData.data.credits || 0}</p>
          </div>

          <AdminUserNotes userId={userData.id} />
        </>
      )}
    </div>
  );
}