import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

export default function Tooltip({ text }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const iconRef = useRef(null);

  useEffect(() => {
    const closeOnClickOutside = (e) => {
      if (iconRef.current && !iconRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOnClickOutside);
    return () => document.removeEventListener('mousedown', closeOnClickOutside);
  }, []);

  const toggleTooltip = () => {
    if (open) {
      setOpen(false);
      return;
    }

    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const scrollX = window.scrollX || document.documentElement.scrollLeft;

      setPosition({
        top: rect.bottom + scrollY + 8, // 8px gap below icon
        left: rect.left + scrollX + rect.width / 2,
      });
    }

    setOpen(true);
  };

  return (
    <>
      <button
        ref={iconRef}
        type="button"
        onClick={toggleTooltip}
        className="w-4 h-4 p-0.5 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center hover:bg-gray-300 focus:outline-none"
      >
        <Info className="w-3 h-3" />
      </button>

      {open &&
        createPortal(
          <div
            className="absolute z-50 w-64 max-w-sm bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg transition-opacity duration-200"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              transform: 'translateX(-50%)',
            }}
          >
            {text}
          </div>,
          document.body
        )}
    </>
  );
}