// components/AdminLogs.jsx
import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchLogs();
  }, []);

  return (
    <div className="bg-white border p-4 rounded shadow mb-10">
      <h2 className="text-xl font-bold mb-4">System Logs</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="border p-2">Timestamp</th>
              <th className="border p-2">Type</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Reason</th>
              <th className="border p-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td className="border p-2">{log.timestamp?.toDate().toLocaleString() || '—'}</td>
                <td className="border p-2">{log.type}</td>
                <td className="border p-2">{log.email}</td>
                <td className="border p-2">{log.reason || '—'}</td>
                <td className="border p-2 whitespace-pre-wrap">{JSON.stringify(log.details, null, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}