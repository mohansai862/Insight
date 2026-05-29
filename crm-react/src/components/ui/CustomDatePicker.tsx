/**
 * Custom Date Picker Component with Modern Calendar UI
 * Provides a clean, responsive calendar interface with month/year grid selection
 */

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { format, parse, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isAfter, isBefore, setMonth, setYear, getYear, getMonth } from 'date-fns';

interface CustomDatePickerProps {
  label: string;
  value: string; // dd-mm-yyyy format
  onChange: (value: string) => void;
  placeholder?: string;
  maxDate?: Date;
  minDate?: Date;
  disabled?: boolean;
  error?: string;
  futureOnly?: boolean; // Only allow future dates (for expected close dates)
}

type CalendarView = 'days' | 'months' | 'years';

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'dd-mm-yyyy',
  maxDate,
  minDate,
  disabled = false,
  error,
  futureOnly = false,
}) => {
  // Set default date constraints based on futureOnly prop
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const effectiveMinDate = futureOnly ? today : minDate;
  const effectiveMaxDate = futureOnly ? undefined : (maxDate || new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>('days');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Convert dd-mm-yyyy string to Date object
  const parseValue = (dateString: string): Date | null => {
    if (!dateString) return null;
    try {
      return parse(dateString, 'dd-MM-yyyy', new Date());
    } catch {
      return null;
    }
  };

  // Convert Date object to dd-mm-yyyy string
  const formatValue = (date: Date | null): string => {
    if (!date) return '';
    try {
      return format(date, 'dd-MM-yyyy');
    } catch {
      return '';
    }
  };

  const selectedDate = parseValue(value);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        // Check if click is inside the portal calendar
        const calendarPortal = document.querySelector('[data-calendar-portal]');
        if (calendarPortal && calendarPortal.contains(target)) {
          return; // Don't close if clicking inside calendar
        }
        setIsOpen(false);
        setCalendarView('days');
        setCurrentMonth(selectedDate || new Date());
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, selectedDate]);

  // Generate calendar days
  const generateCalendarDays = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    // Add padding days from previous month
    const startDay = start.getDay();
    const paddingDays = [];
    for (let i = 0; i < startDay; i++) {
      const paddingDate = new Date(start);
      paddingDate.setDate(start.getDate() - (startDay - i));
      paddingDays.push(paddingDate);
    }

    return [...paddingDays, ...days];
  };

  // Generate months grid
  const generateMonths = () => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const monthDate = setMonth(currentMonth, i);
      months.push({
        date: monthDate,
        name: format(monthDate, 'MMM'),
        fullName: format(monthDate, 'MMMM'),
        value: i
      });
    }
    return months;
  };

  // Generate years grid
  const generateYears = () => {
    const currentYear = getYear(currentMonth);
    const startYear = currentYear - 6;
    const years = [];
    for (let i = 0; i < 12; i++) {
      years.push(startYear + i);
    }
    return years;
  };

  const handleDateSelect = (date: Date) => {
    // Check if date is within allowed range
    if (effectiveMinDate && isBefore(date, effectiveMinDate)) return;
    if (effectiveMaxDate && isAfter(date, effectiveMaxDate)) return;

    onChange(formatValue(date));
    setIsOpen(false);
    setCalendarView('days');
  };

  const handleMonthSelect = (monthIndex: number) => {
    if (isMonthDisabled(monthIndex)) return;
    const newDate = setMonth(currentMonth, monthIndex);
    setCurrentMonth(newDate);
    setCalendarView('days');
  };

  const handleYearSelect = (year: number) => {
    if (isYearDisabled(year)) return;
    const newDate = setYear(currentMonth, year);
    setCurrentMonth(newDate);
    setCalendarView('months');
  };

  const handleInputClick = () => {
    if (!disabled) {
      if (!isOpen) {
        setCurrentMonth(selectedDate || new Date());
        setCalendarView('days');
      }
      setIsOpen(!isOpen);
    }
  };

  const handlePrevMonth = () => {
    if (calendarView === 'days') {
      setCurrentMonth(prev => subMonths(prev, 1));
    } else if (calendarView === 'years') {
      setCurrentMonth(prev => setYear(prev, getYear(prev) - 12));
    } else if (calendarView === 'months') {
      setCurrentMonth(prev => setYear(prev, getYear(prev) - 1));
    }
  };

  const handleNextMonth = () => {
    if (calendarView === 'days') {
      setCurrentMonth(prev => addMonths(prev, 1));
    } else if (calendarView === 'years') {
      setCurrentMonth(prev => setYear(prev, getYear(prev) + 12));
    } else if (calendarView === 'months') {
      setCurrentMonth(prev => setYear(prev, getYear(prev) + 1));
    }
  };

  const handleHeaderClick = () => {
    if (calendarView === 'days') {
      setCalendarView('months');
    } else if (calendarView === 'months') {
      setCalendarView('years');
    }
  };

  const isDateDisabled = (date: Date) => {
    if (effectiveMinDate && isBefore(date, effectiveMinDate)) return true;
    if (effectiveMaxDate && isAfter(date, effectiveMaxDate)) return true;
    return false;
  };

  const isMonthDisabled = (monthIndex: number) => {
    const monthDate = setMonth(currentMonth, monthIndex);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    if (effectiveMinDate && isAfter(effectiveMinDate, monthEnd)) return true;
    if (effectiveMaxDate && isBefore(effectiveMaxDate, monthStart)) return true;
    return false;
  };

  const isYearDisabled = (year: number) => {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    if (effectiveMinDate && isAfter(effectiveMinDate, yearEnd)) return true;
    if (effectiveMaxDate && isBefore(effectiveMaxDate, yearStart)) return true;
    return false;
  };

  const calendarDays = generateCalendarDays();
  const months = generateMonths();
  const years = generateYears();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getHeaderText = () => {
    if (calendarView === 'days') {
      return format(currentMonth, 'MMMM yyyy');
    } else if (calendarView === 'months') {
      return format(currentMonth, 'yyyy');
    } else {
      const currentYear = getYear(currentMonth);
      return `${currentYear - 6} - ${currentYear + 5}`;
    }
  };

  return (
    <div className="w-full" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            const inputValue = e.target.value;
            if (inputValue.match(/^\d{0,2}-?\d{0,2}-?\d{0,4}$/)) {
              onChange(inputValue);
            }
          }}
          onClick={handleInputClick}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 pr-10 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${error
            ? 'border-red-300 focus:ring-red-500'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          readOnly={!disabled}
        />
        <button
          type="button"
          onClick={handleInputClick}
          disabled={disabled}
          className="absolute right-3 text-gray-400 hover:text-blue-600 transition-colors flex items-center justify-center w-4 h-4 pointer-events-auto"
          style={{ top: '20px', transform: 'translateY(-50%)' }}
        >
          <Calendar className="w-4 h-4" />
        </button>

        {error && (
          <div className="mt-1 flex items-center space-x-1">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
          </div>
        )}

        {/* Calendar Popup - Fixed Dropdown Style */}
        {isOpen && (
          <div
            data-calendar-portal
            className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[240px] animate-calendar-in z-50"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <ChevronLeft className="w-3 h-3 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                type="button"
                onClick={handleHeaderClick}
                className="text-xs font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {getHeaderText()}
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <ChevronRight className="w-3 h-3 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Days View */}
            {calendarView === 'days' && (
              <>
                {/* Week Days Header */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {weekDays.map(day => (
                    <div key={day} className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((date, index) => {
                    const isCurrentMonth = isSameMonth(date, currentMonth);
                    const isSelected = selectedDate && isSameDay(date, selectedDate);
                    const isToday = isSameDay(date, new Date());
                    const isDisabled = isDateDisabled(date);

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleDateSelect(date)}
                        disabled={isDisabled}
                        className={`w-7 h-7 text-xs rounded-md transition-all duration-150 ${!isCurrentMonth
                          ? 'text-gray-300 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          : isSelected
                            ? 'bg-blue-600 text-white shadow-md'
                            : isToday
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-medium'
                              : isDisabled
                                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
                          }`}
                      >
                        {format(date, 'd')}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Months View */}
            {calendarView === 'months' && (
              <div className="grid grid-cols-3 gap-2">
                {months.map((month) => {
                  const isCurrentMonth = selectedDate && getMonth(selectedDate) === month.value && getYear(selectedDate) === getYear(currentMonth);
                  const isThisMonth = getMonth(new Date()) === month.value && getYear(new Date()) === getYear(currentMonth);
                  const isDisabled = isMonthDisabled(month.value);

                  return (
                    <button
                      key={month.value}
                      type="button"
                      onClick={() => handleMonthSelect(month.value)}
                      disabled={isDisabled}
                      className={`px-3 py-2 text-sm rounded-md transition-all duration-150 ${isDisabled
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : isCurrentMonth
                          ? 'bg-blue-600 text-white shadow-md'
                          : isThisMonth
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                    >
                      {month.name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Years View */}
            {calendarView === 'years' && (
              <div className="grid grid-cols-3 gap-2">
                {years.map((year) => {
                  const isCurrentYear = selectedDate && getYear(selectedDate) === year;
                  const isThisYear = getYear(new Date()) === year;
                  const isDisabled = isYearDisabled(year);

                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => handleYearSelect(year)}
                      disabled={isDisabled}
                      className={`px-3 py-2 text-sm rounded-md transition-all duration-150 ${isDisabled
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : isCurrentYear
                          ? 'bg-blue-600 text-white shadow-md'
                          : isThisYear
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Clear Button */}
            </div>
        )}
      </div>
    </div>
  );
};

export default CustomDatePicker;
