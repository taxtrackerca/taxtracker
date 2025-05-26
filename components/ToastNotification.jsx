import { useEffect, useState } from 'react';

export default function ToastNotification({ message, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fadeOutTimer = setTimeout(() => {
      setVisible(false); // start fade-out
    }, 3500); // Start fade out at 3.5s

    const removeTimer = setTimeout(() => {
      onClose(); // remove from DOM at 4s
    }, 4000);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(removeTimer);
    };
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg z-50 transition-opacity duration-500 ${
      visible ? 'opacity-100' : 'opacity-0'
    } animate-fadeIn`}>
      {message}
    </div>
  );
}