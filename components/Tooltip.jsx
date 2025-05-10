import { Info } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Tooltip({ text }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <span ref={ref} className="relative inline-block ml-1 align-middle">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-4 h-4 p-0.5 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <Info className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute z-10 bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-xs bg-black text-white text-xs px-2 py-1 rounded shadow-lg">
          {text}
        </div>
      )}
    </span>
  );
}