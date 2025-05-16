// components/SupportForm.jsx
import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export default function SupportForm() {
  const [province, setProvince] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

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
        resolved: false,
      });
      setProvince('');
      setMessage('');
      setShowConfirm(false);
      setStatus('Your request has been submitted.');
    } catch (error) {
      setStatus('Error submitting request.');
    }
  };

  const handleStartSubmit = (e) => {
    e.preventDefault();
    if (!province) return setStatus('Please select a province.');
    setShowConfirm(true);
  };

  return (
    <form onSubmit={handleStartSubmit} className="max-w-xl mx-auto p-6 bg-white rounded shadow space-y-4">
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

      {showConfirm ? (
        <div className="bg-yellow-100 border border-yellow-300 p-4 rounded">
          <p className="text-sm text-yellow-800 mb-2">
            ⚠️ Changing your province will delete all of your current monthly tax data. Are you sure you want to continue?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded"
            >
              Yes, Submit Request
            </button>
          </div>
        </div>
      ) : (
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
        >
          Submit Request
        </button>
      )}

      {status && <p className="text-sm text-green-700 mt-2">{status}</p>}
    </form>
  );
}
