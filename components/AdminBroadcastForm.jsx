// components/AdminBroadcastForm.jsx
import { useState } from 'react';
import { postMessage } from '../lib/postMessage';

export default function AdminBroadcastForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showUntil, setShowUntil] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
      await postMessage({ title, content, showUntil, userId: targetUserId || null });
      setStatus('Message posted');
      setTitle('');
      setContent('');
      setShowUntil('');
      setTargetUserId('');
    } catch {
      setStatus('Failed to post message');
    }
  };

  return (
    <div className="bg-white border p-4 rounded shadow mb-10">
      <h2 className="text-xl font-bold mb-4">Send Broadcast Message</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full border p-2 rounded" />
        <textarea placeholder="Message content" value={content} onChange={(e) => setContent(e.target.value)} required rows={4} className="w-full border p-2 rounded" />
        <input type="date" value={showUntil} onChange={(e) => setShowUntil(e.target.value)} required className="w-full border p-2 rounded" />
        <input type="text" placeholder="Target User ID (optional)" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} className="w-full border p-2 rounded" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500">Send</button>
        {status && <p className="text-sm text-green-700 mt-2">{status}</p>}
      </form>
    </div>
  );
}
