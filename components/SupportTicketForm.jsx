// components/SupportTicketForm.jsx
import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export default function SupportTicketForm() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    const user = auth.currentUser;
    if (!user) return setStatus('You must be logged in to submit a request.');

    try {
      await addDoc(collection(db, 'supportTickets'), {
        email: user.email,
        userId: user.uid,
        subject,
        message,
        resolved: false,
        archived: false,
        timestamp: Timestamp.now(),
      });
      setSubject('');
      setMessage('');
      setStatus('Your support ticket has been submitted.');
    } catch (error) {
      setStatus('Error submitting ticket.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-100 border border-white rounded-lg p-4 mb-6 shadow-lg">
      <h2 className="text-xl font-bold">Contact Support</h2>

      <label className="block">
        Subject
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full p-2 border rounded mt-1 mb-2"
          required
        />
      </label>

      <label className="block">
        Message
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="w-full p-2 border rounded mt-1 mb-2"
          required
        ></textarea>
      </label>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
      >
        Submit Request
      </button>

      {status && <p className="text-sm text-green-700 mt-2">{status}</p>}
    </form>
  );
}
