// components/AdminIpAlerts.jsx
import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, setDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function AdminIpAlerts() {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        const fetchAlerts = async () => {
            const q = query(
                collection(db, 'adminAlerts'),
                where('type', '==', 'duplicateTrial_IP'),
                where('resolved', '==', false),
                orderBy('timestamp', 'desc')
            );
            const snap = await getDocs(q);
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAlerts(data);
        };

        fetchAlerts();
    }, []);

    const markResolved = async (id) => {
        await updateDoc(doc(db, 'adminAlerts', id), { resolved: true });
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    const blockTrialEmail = async (email) => {
        const lowerEmail = email.toLowerCase();
        await setDoc(doc(db, 'trialBlocks', lowerEmail), {
          reason: 'Duplicate trial from same IP',
          timestamp: new Date(),
        });
        alert(`Trial access blocked for ${lowerEmail}`);
      };

    return (
        <div className="mb-10 bg-white border p-4 rounded shadow">
            <h2 className="text-xl font-bold mb-4">IP Alerts (Duplicate Trials)</h2>
            {alerts.length === 0 ? (
                <p>No duplicate trial alerts.</p>
            ) : (
                alerts.map(alert => (
                    <details key={alert.id} className="mb-3 p-3 border rounded bg-yellow-50">
                        <summary className="cursor-pointer font-medium">
                            Shared IP: {alert.ipAddress}
                        </summary>
                        <p className="text-sm mt-2"><strong>Original:</strong> {alert.originalEmail}</p>
                        <p className="text-sm"><strong>New:</strong> {alert.newEmail}</p>
                        <p className="text-xs text-gray-500 mb-2">
                            {new Date(alert.timestamp?.toDate()).toLocaleString()}
                        </p>
                        <button
                            onClick={() => markResolved(alert.id)}
                            className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500"
                        >
                            Mark Resolved
                        </button>
                        <button
                            onClick={() => blockTrialEmail(alert.newEmail)}
                            className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500 ml-2"
                        >
                            Block Trial for {alert.newEmail}
                        </button>
                    </details>
                ))
            )}
        </div>
    );
}