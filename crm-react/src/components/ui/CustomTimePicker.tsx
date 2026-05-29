/**
 * Custom Time Picker Component with Modern UI
 * Provides a clean, responsive time selection interface
 */

import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';

interface CustomTimePickerProps {
  label: string;
  value: string; // HH:MM format
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'HH:MM',
  disabled = false,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState('00');
  const [minutes, setMinutes] = useState('00');
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse value into hours and minutes
  useEffect(() => {
    if (value && value.includes(':')) {
      const [h, m] = value.split(':');
      setHours(h.padStart(2, '0'));
      setMinutes(m.padStart(2, '0'));
    } else {
      setHours('00');
      setMinutes('00');
    }
  }, [value]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleTimeChange = (newHours: string, newMinutes: string) => {
    const formattedTime = `${newHours.padStart(2, '0')}:${newMinutes.padStart(2, '0')}`;
    onChange(formattedTime);
  };

  const adjustHours = (increment: boolean) => {
    const currentHours = parseInt(hours);
    let newHours = increment ? currentHours + 1 : currentHours - 1;
    if (newHours > 23) newHours = 0;
    if (newHours < 0) newHours = 23;
    const newHoursStr = newHours.toString().padStart(2, '0');
    setHours(newHoursStr);
    handleTimeChange(newHoursStr, minutes);
  };

  const adjustMinutes = (increment: boolean) => {
    const currentMinutes = parseInt(minutes);
    let newMinutes = increment ? currentMinutes + 1 : currentMinutes - 1;
    if (newMinutes > 59) newMinutes = 0;
    if (newMinutes < 0) newMinutes = 59;
    const newMinutesStr = newMinutes.toString().padStart(2, '0');
    setMinutes(newMinutesStr);
    handleTimeChange(hours, newMinutesStr);
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="w-full" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value || ''}
          onClick={handleInputClick}
          placeholder={placeholder}
          disabled={disabled}
          readOnly
          className={`w-full px-3 py-2 pr-10 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
            error
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
          } ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        />
        <button
          type="button"
          onClick={handleInputClick}
          disabled={disabled}
          className="absolute right-3 top-3 text-gray-400 hover:text-blue-600 transition-colors"
        >
          <Clock className="w-4 h-4" />
        </button>
        
        {error && (
          <div className="mt-1 flex items-center space-x-1">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
          </div>
        )}
        
        {/* Time Picker Popup */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4 min-w-[200px]">
            <div className="flex items-center justify-center space-x-4">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => adjustHours(true)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <div 
                  className="w-12 h-10 flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 rounded-lg font-mono text-lg font-semibold text-blue-600 dark:text-blue-400 cursor-pointer"
                  onWheel={(e) => {
                    e.preventDefault();
                    adjustHours(e.deltaY < 0);
                  }}
                >
                  {hours}
                </div>
                <button
                  type="button"
                  onClick={() => adjustHours(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              
              {/* Separator */}
              <div className="text-2xl font-bold text-gray-400">:</div>
              
              {/* Minutes */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => adjustMinutes(true)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <div 
                  className="w-12 h-10 flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 rounded-lg font-mono text-lg font-semibold text-blue-600 dark:text-blue-400 cursor-pointer"
                  onWheel={(e) => {
                    e.preventDefault();
                    adjustMinutes(e.deltaY < 0);
                  }}
                >
                  {minutes}
                </div>
                <button
                  type="button"
                  onClick={() => adjustMinutes(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
            
            {/* Quick Time Buttons */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {['09:00', '12:00', '15:00', '18:00', '21:00', 'Now'].map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => {
                    if (time === 'Now') {
                      const now = new Date();
                      const nowTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                      onChange(nowTime);
                    } else {
                      onChange(time);
                    }
                    setIsOpen(false);
                  }}
                  className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                >
                  {time}
                </button>
              ))}
            </div>
            
            {/* Clear Button */}
            {value && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  Clear Time
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomTimePicker;
