// components/AdminOverview.jsx
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function AdminOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    trialUsers: 0,
    pendingRequests: 0,
    referralsIssued: 0,
    referralsUsed: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);

      let total = 0;
      let subs = 0;
      let trials = 0;
      let issued = 0;
      let used = 0;

      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        total++;
        if (data.subscriptionId) subs++;
        if (data.createdAt && new Date(data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt) > thirtyDaysAgo) trials++;
        if (data.referralCode) issued++;
        if (data.referredBy) used++;
      });

      const supportQuery = query(collection(db, 'supportRequests'), where('resolved', '==', false));
      const supportSnap = await getDocs(supportQuery);

      setStats({
        totalUsers: total,
        activeSubscriptions: subs,
        trialUsers: trials,
        pendingRequests: supportSnap.size,
        referralsIssued: issued,
        referralsUsed: used,
      });
    };

    fetchStats();
  }, []);

  return (
    <div className="bg-white border p-4 rounded shadow mb-8">
      <h2 className="text-xl font-bold mb-4">📊 Dashboard Overview</h2>
      <ul className="space-y-1 text-gray-800">
        <li><strong>Total Users:</strong> {stats.totalUsers}</li>
        <li><strong>Active Subscriptions:</strong> {stats.activeSubscriptions}</li>
        <li><strong>Trial Users (last 30 days):</strong> {stats.trialUsers}</li>
        <li><strong>Pending Support Requests:</strong> {stats.pendingRequests}</li>
        <li><strong>Referrals Issued:</strong> {stats.referralsIssued}</li>
        <li><strong>Referrals Used:</strong> {stats.referralsUsed}</li>
      </ul>
    </div>
  );
} 
