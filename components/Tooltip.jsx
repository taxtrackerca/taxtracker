import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

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
        <span ref={ref} className="relative inline-block">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-4 h-4 p-0.5 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center hover:bg-gray-300 focus:outline-none"
            >
                <Info className="w-3 h-3" />
            </button>

            {open && (
                <div className="absolute left-1/2 top-full mt-2 transform -translate-x-1/2 w-60 max-w-xs bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-50">
                    {text}
                </div>

            )}
        </span>
    );
}