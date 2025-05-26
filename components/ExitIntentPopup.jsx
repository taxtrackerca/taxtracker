import { useState } from 'react';
import { X } from 'lucide-react';

export default function ExitIntentPopup({ show, onClose, onSubmit }) {
  const [email, setEmail] = useState('');
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!show) return null;

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('newsletterDismissed', 'true');
    }
    onClose(true);
  };

  const handleSubscribe = () => {
    if (dontShowAgain) {
      localStorage.setItem('newsletterDismissed', 'true');
    }
    onSubmit(email);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative border border-gray-200">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          onClick={handleClose}
        >
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Wait! Before you go...</h2>
        <p className="text-gray-600 mb-4">
          Get our <strong>free weekly tax tips</strong> and small business reminders straight to your inbox.
        </p>
        <div className="flex flex-col gap-3">
          <input
            type="email"
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            onClick={handleSubscribe}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-all"
          >
            Subscribe Now
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={() => setDontShowAgain(!dontShowAgain)}
              className="form-checkbox"
            />
            Don’t show this again
          </label>
          <button
            onClick={handleClose}
            className="text-sm text-gray-500 underline hover:text-gray-700 mt-2"
          >
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
}