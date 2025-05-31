import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getAuth } from 'firebase/auth';

export default function AdminPendingReferrals() {
  const [pendingCredits, setPendingCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [isAdmin, setIsAdmin] = useState(null); // null = loading, false = not admin
  const auth = getAuth();

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      setLoading(true);
      
      const user = auth.currentUser;

      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};

      if (!userData.isAdmin) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const pending = [];

      for (const docSnap of usersSnapshot.docs) {
        const data = docSnap.data();
        if (
          data.referralStatus === 'paid' &&
          data.referredBy &&
          !data.referralCreditGranted
        ) {
          const referrerDoc = await getDoc(doc(db, 'users', data.referredBy));
          const referrerData = referrerDoc.exists() ? referrerDoc.data() : null;

          pending.push({
            referredId: docSnap.id,
            referredEmail: data.email,
            referrerEmail: referrerData?.email || 'N/A',
            referrerId: data.referredBy,
          });
        }
      }

      setPendingCredits(pending);
      setLoading(false);
    };

    checkAdminAndFetch();
  }, []);

  const grantCredit = async (referredId) => {
  setStatus('');
  if (!auth.currentUser) {
    setStatus('You must be logged in to perform this action.');
    return;
  }

  try {
    const token = await auth.currentUser.getIdToken();
    const res = await fetch('/api/grant-referral-credit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ referredUid: referredId }),
    });

    const result = await res.json();
    if (result.success) {
      setStatus('Credit granted successfully!');
      setPendingCredits((prev) => prev.filter((p) => p.referredId !== referredId));
    } else {
      setStatus(result.error || 'Failed to grant credit.');
    }
  } catch (err) {
    console.error(err);
    setStatus('Server error while granting credit.');
  }
};

  if (isAdmin === false) {
    return <p className="text-red-600 p-4">Access denied. Admins only.</p>;
  }

  return (
    <div className="bg-white border p-4 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Pending Referral Credits</h2>
      {loading ? (
        <p>Loading...</p>
      ) : pendingCredits.length === 0 ? (
        <p>No pending referrals found.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left">Referred User</th>
              <th className="text-left">Referrer</th>
              <th className="text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingCredits.map((entry) => (
              <tr key={entry.referredId} className="border-t">
                <td>{entry.referredEmail}</td>
                <td>{entry.referrerEmail}</td>
                <td>
                  <button
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500"
                    onClick={() => grantCredit(entry.referredId)}
                  >
                    Grant $4.95 Credit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {status && <p className="text-sm text-blue-700 mt-2">{status}</p>}
    </div>
  );
}