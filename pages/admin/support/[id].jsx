// pages/admin/support/thread/[id].jsx
import { useRouter } from 'next/router';
import AdminSupportThread from '../../../components/AdminSupportThread';
export default function AdminThreadPage() {
  const router = useRouter();
  const { id } = router.query;

  if (!id) return <p className="p-4">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🧵 Support Ticket</h1>
      <AdminSupportThread threadId={id} />
    </div>
  );
}
