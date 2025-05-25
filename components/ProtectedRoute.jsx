import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ProtectedRoute({ children, adminOnly = false }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (!user) {
          router.push('/login');
          return;
        }
  
        await user.reload();
  
        if (!user.emailVerified) {
          router.push('/verify-email');
          return;
        }
  
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const data = userDoc.data();
  
        if (!data?.businessName || !data?.province) {
          router.push('/account-setup');
          return;
        }
  
        if (adminOnly && !data?.isAdmin) {
          router.push('/');
          return;
        }
  
        setLoading(false);
      });
  
      return () => unsubscribe();
    }, [router, adminOnly]);
  
    if (loading) {
      return <div className="p-4 text-center">Checking access...</div>;
    }
  
    return children;
  }