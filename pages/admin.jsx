// pages/admin.jsx
import { useState } from 'react';
import AdminDashboard from '../components/AdminDashboard';

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthenticated(true);
    } else {
      alert('Incorrect password');
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-full max-w-sm">
          <h1 className="text-lg font-bold mb-4">Admin Login</h1>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter admin password"
            className="w-full border p-2 mb-4 rounded"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return <AdminDashboard />;
}