'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  minDate?: string; // YYYY-MM-DD
  label?: string;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function parseDate(str: string): Date | null {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDisplay(str: string): string {
  if (!str) return '';
  const [y, m, d] = str.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function DatePicker({ value, onChange, placeholder = 'Select date', hasError, minDate }: DatePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const initDate = parseDate(value) || today;
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());
  const [yearPickerOpen, setYearPickerOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync view when value changes externally
  useEffect(() => {
    if (value) {
      const d = parseDate(value);
      if (d) { setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setYearPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const minD = minDate ? parseDate(minDate) : null;

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    onChange(toYMD(date));
    setOpen(false);
    setYearPickerOpen(false);
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    const sel = parseDate(value);
    return sel?.getFullYear() === viewYear && sel?.getMonth() === viewMonth && sel?.getDate() === day;
  };

  const isToday = (day: number) => {
    return today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
  };

  const isDisabled = (day: number) => {
    if (!minD) return false;
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    return d < minD;
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  // Year picker range
  const currentCentury = Math.floor(viewYear / 10) * 10;
  const yearRange = Array.from({ length: 12 }, (_, i) => currentCentury - 1 + i);

  return (
    <div ref={containerRef} className="relative">
      {/* Input trigger */}
      <div
        onClick={() => { setOpen(o => !o); setYearPickerOpen(false); }}
        className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border text-sm cursor-pointer transition-all select-none ${
          hasError
            ? 'border-red-400 bg-red-50'
            : open
            ? 'border-[#1A3580] bg-white ring-2 ring-[#1A3580]/10'
            : 'border-border bg-input-background hover:border-[#1A3580]/50'
        }`}
      >
        <Calendar size={15} className={`flex-shrink-0 ${open ? 'text-[#1A3580]' : 'text-muted-foreground'}`} />
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        {value && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange(''); }}
            className="ml-auto text-muted-foreground hover:text-foreground text-xs leading-none"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown calendar */}
      {open && (
        <div className="absolute z-50 mt-1.5 bg-white rounded-xl border border-border shadow-xl w-72 overflow-hidden"
          style={{ boxShadow: '0 8px 32px rgba(14,34,113,0.12)' }}>

          {/* Month / Year header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-[#0E2271] to-[#1A3580]">
            <button
              type="button"
              onClick={prevMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={() => setYearPickerOpen(y => !y)}
              className="flex items-center gap-1 text-white font-semibold text-sm hover:bg-white/10 px-2 py-1 rounded-lg transition-colors"
            >
              {MONTHS[viewMonth]} {viewYear}
              <ChevronRight size={12} className={`transition-transform ${yearPickerOpen ? 'rotate-90' : ''}`} />
            </button>

            <button
              type="button"
              onClick={nextMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Year picker overlay */}
          {yearPickerOpen && (
            <div className="p-3 border-b border-border bg-[#f7f9ff]">
              <div className="flex items-center justify-between mb-2">
                <button type="button" onClick={() => setViewYear(y => y - 10)}
                  className="p-1 rounded hover:bg-secondary text-muted-foreground">
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs font-semibold text-[#0E2271]">{yearRange[0]} – {yearRange[yearRange.length - 1]}</span>
                <button type="button" onClick={() => setViewYear(y => y + 10)}
                  className="p-1 rounded hover:bg-secondary text-muted-foreground">
                  <ChevronRight size={14} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {yearRange.map(yr => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => { setViewYear(yr); setYearPickerOpen(false); }}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                      yr === viewYear
                        ? 'bg-[#1A3580] text-white'
                        : yr === today.getFullYear()
                        ? 'border border-[#1A3580] text-[#1A3580]'
                        : 'hover:bg-secondary text-foreground'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Weekday headers */}
          <div className="grid grid-cols-7 px-3 pt-3 pb-1">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
            {/* Empty cells for first day offset */}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const disabled = isDisabled(day);
              const selected = isSelected(day);
              const todayDay = isToday(day);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDay(day)}
                  className={`h-8 w-full flex items-center justify-center rounded-lg text-sm transition-all font-medium ${
                    selected
                      ? 'bg-[#1A3580] text-white shadow-sm'
                      : disabled
                      ? 'text-muted-foreground/30 cursor-not-allowed'
                      : todayDay
                      ? 'border border-[#1A3580] text-[#1A3580] hover:bg-[#1A3580]/10'
                      : 'text-foreground hover:bg-[#1A3580]/8 hover:text-[#1A3580]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer: Today shortcut */}
          <div className="border-t border-border px-3 py-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => { onChange(toYMD(today)); setOpen(false); }}
              className="text-xs text-[#1A3580] font-semibold hover:underline"
            >
              Today
            </button>
            {value && (
              <button
                type="button"
                onClick={() => { onChange(''); }}
                className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
