// components/SupportForm.jsx
import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export default function SupportForm() {
  const [province, setProvince] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    const user = auth.currentUser;
    if (!user) return setStatus('You must be logged in to submit a request.');

    try {
      await addDoc(collection(db, 'supportRequests'), {
        email: user.email,
        requestedProvince: province,
        message,
        timestamp: new Date().toISOString(),
      });
      setProvince('');
      setMessage('');
      setStatus('Your request has been submitted.');
    } catch (error) {
      setStatus('Error submitting request.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-6 bg-white rounded shadow space-y-4">
      <h2 className="text-xl font-bold">Request Location Change</h2>

      <label className="block">
        Select New Province or Territory:
        <select
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="w-full p-2 border rounded mt-1"
          required
        >
          <option value="">Select...</option>
          {[
            'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
            'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario',
            'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon',
          ].map((prov) => (
            <option key={prov} value={prov}>{prov}</option>
          ))}
        </select>
      </label>

      <label className="block">
        Additional Message (optional):
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-2 border rounded mt-1"
          rows={4}
        />
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
