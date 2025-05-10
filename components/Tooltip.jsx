import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

export default function Tooltip({ text }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState('bottom'); // 'top' or 'bottom'
  const [alignLeft, setAlignLeft] = useState(false);
  const ref = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    // Toggle if already open
    if (open) {
      setOpen(false);
      return;
    }

    if (!ref.current) return;
    const buttonRect = ref.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    const spaceRight = window.innerWidth - buttonRect.left;

    // Vertical positioning
    if (spaceBelow < 100 && spaceAbove > 100) {
      setPosition('top');
    } else {
      setPosition('bottom');
    }

    // Horizontal positioning
    if (spaceRight < 200) {
      setAlignLeft(true);
    } else {
      setAlignLeft(false);
    }

    setOpen(true);
  };

  return (
    <span ref={ref} className="relative inline-block z-10">
      <button
        type="button"
        onClick={handleToggle}
        className="w-4 h-4 p-0.5 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center hover:bg-gray-300 focus:outline-none"
      >
        <Info className="w-3 h-3" />
      </button>

      {open && (
        <div
          className={`absolute w-60 max-w-xs bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg
            ${position === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'}
            ${alignLeft ? 'left-0' : 'left-1/2 -translate-x-1/2'}
          `}
          style={{ maxWidth: 'calc(100vw - 2rem)' }} // protect from horizontal clipping
        >
          {text}
        </div>
      )}
    </span>
  );
}