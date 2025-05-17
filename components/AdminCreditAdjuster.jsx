import { useState } from 'react';
import { getDocs, collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function AdminCreditAdjuster() {
  const [query, setQuery] = useState('');
  const [userId, setUserId] = useState('');
  const [currentCredits, setCurrentCredits] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [status, setStatus] = useState('');

  const handleLookup = async () => {
    setStatus('');
    setCurrentCredits(null);
    setUserId('');

    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const match = snapshot.docs.find(doc => doc.id === query || doc.data().email === query);
      if (!match) {
        setStatus('User not found.');
        return;
      }

      const data = match.data();
      setUserId(match.id);
      setCurrentCredits(data.credits || 0);
    } catch (err) {
      console.error(err);
      setStatus('Error looking up user.');
    }
  };

  const handleAdjust = async () => {
    if (!userId || adjustAmount === '') return;

    try {
      const newCredits = Math.max(0, currentCredits + parseInt(adjustAmount));
      await setDoc(doc(db, 'users', userId), { credits: newCredits }, { merge: true });

      await logEvent({
        userId: uid,
        email,
        type: 'manual_credit_change',
        reason: creditReason, // capture this from a form field
        details: { newCredits: parseInt(credits) }
      });

      setCurrentCredits(newCredits);
      setAdjustAmount('');
      setStatus(`Credits updated to ${newCredits}`);
    } catch (err) {
      console.error(err);
      setStatus('Error updating credits.');
    }
  };

  return (
    <div className="bg-white border p-4 rounded shadow mb-10">
      <h2 className="text-xl font-bold mb-4">Manual Credit Adjustment</h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Enter email or UID"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button onClick={handleLookup} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500">
          Lookup
        </button>
      </div>

      {userId && (
        <div className="space-y-4">
          <p className="text-sm">Current Credits: <strong>{currentCredits}</strong></p>
          <input
            type="number"
            placeholder="Amount to add/remove"
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)}
            className="w-full border p-2 rounded"
          />
          <button onClick={handleAdjust} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500">
            Update Credits
          </button>
        </div>
      )}

      {status && <p className="text-sm text-green-700 mt-2">{status}</p>}
    </div>
  );
}