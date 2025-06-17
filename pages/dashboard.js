// Dashboard.js with countdown timer for paused subscriptions
import { useEffect, useState, useRef } from 'react';
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
import ProtectedRoute from '../components/ProtectedRoute';

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
  const [trialEnds, setTrialEnds] = useState(null);
  const [pauseEndsAt, setPauseEndsAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const router = useRouter();
  const trackerRef = useRef(null);
  

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        await currentUser.reload(); // refresh email verification status
        if (!currentUser.emailVerified) {
          router.push('/verify-email');
          return;
        }
        setUser(currentUser);
        const uid = currentUser.uid;
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (!userDoc.exists()) return;

        const data = userDoc.data();

        // Check if account setup is incomplete
        if (!data.businessName || !data.province) {
          router.push('/account-setup');
          return;
        }
        setUserData(data);
        setBusinessName(data.businessName || '');

        const token = await currentUser.getIdToken();
        const res = await fetch('/api/subscription-status', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const sub = await res.json();
        setSubscriptionStatus(sub);

        const now = new Date();
        const signupDate = data.signupTimestamp?.toDate?.() || new Date(data.signupTimestamp);
        const trialEndDate = new Date(signupDate);
        trialEndDate.setDate(trialEndDate.getDate() + 7);
        setTrialEnds(trialEndDate);

        const trialExpired = now > trialEndDate;
        const isPaused = data.paused === true;
        const hasActiveSub = sub?.status === 'active' || sub?.status === 'trialing';

        if (!hasActiveSub && !isPaused && trialExpired) {
          setBlocked(true);
        }

        if (isPaused && hasActiveSub && sub?.currentPeriodEnd) {
          setPauseEndsAt(new Date(sub.currentPeriodEnd * 1000));
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!pauseEndsAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = pauseEndsAt - now;

      if (diff <= 0) {
        setTimeLeft('Access expires soon');
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pauseEndsAt]);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  const handleMonthSelect = (month) => {
    setSelectedMonth(`${month} ${currentYear}`);

    // Scroll after short delay to ensure component has rendered
    setTimeout(() => {
      if (trackerRef.current) {
        trackerRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  if (!user) return null;

  if (blocked) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm text-center">
          <h2 className="text-xl font-bold mb-2">Your Free Trial Has Ended</h2>
          <p className="mb-4 text-gray-700">
            Your 7-day free trial is over. To keep using TaxTracker for 23 more free days, add a credit card now.
            <br />
            <strong>You won’t be charged until your 30-day trial ends.</strong>
          </p>
          <button
            onClick={() => router.push('/subscribe')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
          >
            Continue Free Trial
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="p-4">
        <div className="mb-2">
          {userData?.paused && !blocked && timeLeft && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded mb-4">
              Your subscription is paused. You have {timeLeft} of access remaining.
            </div>
          )}
          <h1 className="text-2xl font-bold">Dashboard</h1>
          {businessName && <p className="text-xl font-bold">{businessName}</p>}
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
                onClick={() => handleMonthSelect(month)}
                className={`px-4 py-2 border rounded ${selectedMonth === `${month} ${currentYear}` ? 'bg-blue-600 text-white' : 'hover:bg-blue-100'}`}
              >
                {month} {currentYear}
              </button>
            ))}
          </div>
        </div>

        {selectedMonth && (
          <div className="mt-8" ref={trackerRef}>
            <MonthTracker
              monthId={selectedMonth}
              onRefresh={() => setRefreshYTD(prev => !prev)}
            />
          </div>
        )}

      </div>
    </ProtectedRoute>
  );

}

// ✅ FIXED: disables static generation for this page
export async function getServerSideProps() {
  return { props: {} };
}