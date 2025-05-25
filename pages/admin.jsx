import ProtectedRoute from '../components/ProtectedRoute';
import AdminDashboard from '../components/AdminDashboard';
import Link from 'next/link';

export default function AdminPage() {
  return (
    <ProtectedRoute adminOnly={true}>
      <div className="p-4">
        <Link href="/dashboard" className="text-blue-600 hover:underline">← Back to Dashboard</Link>
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <AdminDashboard />
      </div>
    </ProtectedRoute>
  );
}