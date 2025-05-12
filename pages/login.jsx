// pages/login.jsx
import { useState, useEffect } from 'react'; // ✅ FIXED: added useEffect
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/dashboard');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err) {
      setError('Invalid login credentials. Don’t have an account? ');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white shadow-md rounded-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Login to TaxTracker</h1>

        {error && (
          <div className="mb-4 text-sm text-red-600">
            {error}
            <Link href="/signup" className="text-blue-600 hover:underline ml-1">
              Create one here.
            </Link>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-4 py-2 focus:outline-none focus:ring focus:ring-blue-200"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-4 py-2 focus:outline-none focus:ring focus:ring-blue-200"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>

        <div className="text-center mt-4 text-sm text-gray-600">
          <Link href="/reset-password" className="text-blue-600 hover:underline">
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  );
}

// ✅ FIXED: disables static generation for this page
export async function getServerSideProps() {
  return { props: {} };
}