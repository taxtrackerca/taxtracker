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
import DashboardMessages from '../components/DashboardMessages';
import { useRouter } from 'next/router';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [user, setUser] = useState(null);
  const [refreshYTD, setRefreshYTD] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [userData, setUserData] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const router = useRouter();

  const currentYear = new Date().getFullYear();

    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
        if (!currentUser) {
          router.push('/login');
        } else {
          setUser(currentUser);
          const uid = currentUser.uid;
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (!userDoc.exists()) return;
    
          const data = userDoc.data();
          setUserData(data);
    
          // Check subscription status
          const token = await currentUser.getIdToken();
          const res = await fetch('/api/subscription-status', {
            headers: { Authorization: `Bearer ${token}` },
          });
    
          const sub = await res.json();
          setSubscriptionStatus(sub);
    
          const now = new Date();
          const signupDate = data.signupTimestamp?.toDate?.() || new Date(data.signupTimestamp);
          const trialEnds = new Date(signupDate);
          trialEnds.setDate(trialEnds.getDate() + 30);
    
          const trialExpired = now > trialEnds;
          const isPaused = data.paused === true;
          const hasActiveSub = sub?.status === 'active';
    
          if (isPaused && trialExpired && !hasActiveSub) {
            setBlocked(true);
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

if (blocked) {
  return (
    <div className="p-6 text-center max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Paused</h1>
      <p className="text-gray-600 mb-4">
        Your trial has ended and your subscription is currently paused.
      </p>
      <Link href="/account">
        <a className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-500">
          Resume Subscription
        </a>
      </Link>
    </div>
  );
}
  return (
    <div className="p-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {businessName && <p className="text-sm text-gray-600">{businessName}</p>}
      </div>

      <DashboardMessages />

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
