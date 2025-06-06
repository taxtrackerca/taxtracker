// components/AdminBroadcastForm.jsx
import { useState } from 'react';
import { postMessage } from '../lib/postMessage';

export default function AdminBroadcastForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showUntil, setShowUntil] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [status, setStatus] = useState('');
  const [requestReply, setRequestReply] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
      await postMessage({ title, content, userEmail: targetUserId || null, requestReply });
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
        <input type="email" placeholder="Target User Email (optional)" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} className="w-full border p-2 rounded" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500">Send</button>
        {status && <p className="text-sm text-green-700 mt-2">{status}</p>}
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={requestReply}
            onChange={(e) => setRequestReply(e.target.checked)}
          />
          <span>Request user reply</span>
        </label>
      </form>
    </div>
  );
}
