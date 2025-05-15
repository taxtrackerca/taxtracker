// Dashboard.js with export buttons restored above summary
import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import DashboardSummary from '../components/DashboardSummary';
import MonthTracker from '../components/MonthTracker';
import ExportSummaryCSV from '../components/ExportSummaryCSV';
import ExportSummaryPDF from '../components/ExportSummaryPDF';
import Link from 'next/link';
import { signOut } from 'firebase/auth';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [user, setUser] = useState(null);
  const [refreshYTD, setRefreshYTD] = useState(false);
  const [businessName, setBusinessName] = useState('');

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        window.location.href = '/login';
      } else if (!u.emailVerified) {
        window.location.href = '/verify-email';
      } else {
        setUser(u);
        const profileRef = doc(db, 'users', u.uid);
        const snap = await getDoc(profileRef);
        if (snap.exists()) {
          const profile = snap.data();
          setBusinessName(profile.businessName || '');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  if (!user) return null;

  return (
    <div className="p-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {businessName && <p className="text-sm text-gray-600">{businessName}</p>}
      </div>

      <div className="mb-6"></div>
        

      <div className="flex gap-4 mb-4">
        <ExportSummaryCSV />
        <ExportSummaryPDF />
      </div>

      <DashboardSummary refresh={refreshYTD} />

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Select a Month</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {months.map((month) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(`${month} ${currentYear}`)}
              className={`px-4 py-2 border rounded ${selectedMonth === `${month} ${currentYear}` ? 'bg-blue-600 text-white' : 'hover:bg-blue-100'}`}
            >
              {month} {currentYear}
            </button>
          ))}
        </div>
      </div>

      {selectedMonth && (
        <div className="mt-8">
          <MonthTracker monthId={selectedMonth} onRefresh={() => setRefreshYTD(prev => !prev)} />
        </div>
      )}
    </div>
  );
}

// ✅ FIXED: disables static generation for this page
export async function getServerSideProps() {
  return { props: {} };
}
