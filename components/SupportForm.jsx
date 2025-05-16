import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export default function SupportForm() {
  const [province, setProvince] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      setStatus('You must be logged in to submit a request.');
      return;
    }

    try {
      await addDoc(collection(db, 'supportRequests'), {
        email: user.email,
        requestedProvince: province,
        message,
        timestamp: new Date(),
        resolved: false,
      });
      setProvince('');
      setMessage('');
      setStatus('Your request has been submitted.');
    } catch (error) {
      console.error(error);
      setStatus('Error submitting request.');
    } finally {
      setShowConfirm(false);
    }
  };

  const handleConfirmation = (e) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  return (
    <form onSubmit={handleConfirmation} className="max-w-xl mx-auto p-6 bg-white rounded shadow space-y-4">
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

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Are you sure?</h3>
            <p className="mb-4 text-sm text-gray-700">
              Submitting this request will permanently clear all your current tax data. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500"
              >
                Yes, Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}