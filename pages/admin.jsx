// pages/admin.jsx
import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import AdminDashboard from '../components/AdminDashboard';
import Link from 'next/link';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        window.location.href = '/login';
        return;
      }

      setUser(u);

      const profileRef = doc(db, 'users', u.uid);
      const snap = await getDoc(profileRef);
      const data = snap.data();

      if (!snap.exists() || !data?.isAdmin) {
        window.location.href = '/';
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <p className="p-4">Loading...</p>;
  }

  return (
    <div className="p-4">
      <Link href="/dashboard" className="text-blue-600 hover:underline">← Back to Dashboard</Link>
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      {isAdmin ? <AdminDashboard /> : <p>Unauthorized</p>}
    </div>
  );
}
