import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

export default function Tooltip({ text }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState('bottom'); // 'top' or 'bottom'
  const [alignLeft, setAlignLeft] = useState(false);
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

  const handleOpen = () => {
    if (!ref.current) return;

    const buttonRect = ref.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    const spaceRight = window.innerWidth - buttonRect.left;

    // Decide vertical position
    if (spaceBelow < 100 && spaceAbove > 100) {
      setPosition('top');
    } else {
      setPosition('bottom');
    }

    // Decide horizontal alignment
    if (spaceRight < 200) {
      setAlignLeft(true);
    } else {
      setAlignLeft(false);
    }

    setOpen(true);
  };

  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={handleOpen}
        className="w-4 h-4 p-0.5 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center hover:bg-gray-300 focus:outline-none"
      >
        <Info className="w-3 h-3" />
      </button>

      {open && (
        <div
          className={`absolute z-50 w-60 max-w-xs bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg
            ${position === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'}
            ${alignLeft ? 'left-0' : 'left-1/2 -translate-x-1/2'}
          `}
        >
          {text}
        </div>
      )}
    </span>
  );
}