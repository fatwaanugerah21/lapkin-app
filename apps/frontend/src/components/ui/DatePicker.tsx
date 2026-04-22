import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  addMonths,
  addDays,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isValid,
  parse,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { clsx } from 'clsx';

type DatePickerProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

const displayPattern = 'dd/MM/yyyy';
const valuePattern = 'yyyy-MM-dd';

function parseValue(value: string): Date | null {
  if (!value) return null;
  const parsed = parse(value, valuePattern, new Date());
  return isValid(parsed) ? parsed : null;
}

function yearOptions(baseYear: number): number[] {
  const years: number[] = [];
  for (let year = baseYear - 10; year <= baseYear + 10; year += 1) {
    years.push(year);
  }
  return years;
}

export function DatePicker({
  label,
  value,
  onChange,
  placeholder = 'dd/mm/yyyy',
  className,
}: DatePickerProps) {
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedDate = useMemo(() => parseValue(value), [value]);
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(selectedDate ?? new Date());
  const [focusedDate, setFocusedDate] = useState<Date>(selectedDate ?? new Date());

  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
      setFocusedDate(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [viewDate]);

  const renderedValue = selectedDate ? format(selectedDate, displayPattern) : '';
  const canClear = renderedValue !== '';
  const monthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, idx) => ({ value: idx, label: format(new Date(2026, idx, 1), 'MMMM', { locale: idLocale }) })),
    [],
  );
  const years = useMemo(() => yearOptions(viewDate.getFullYear()), [viewDate]);

  return (
    <div ref={rootRef} className={clsx('relative flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type="text"
          value={renderedValue}
          placeholder={placeholder}
          readOnly
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setIsOpen(false);
            return;
          }
          if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault();
            setIsOpen(true);
            return;
          }
          if (!isOpen) return;
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const next = subDays(focusedDate, 1);
            setFocusedDate(next);
            if (!isSameMonth(next, viewDate)) setViewDate(next);
            return;
          }
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            const next = addDays(focusedDate, 1);
            setFocusedDate(next);
            if (!isSameMonth(next, viewDate)) setViewDate(next);
            return;
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            const next = subWeeks(focusedDate, 1);
            setFocusedDate(next);
            if (!isSameMonth(next, viewDate)) setViewDate(next);
            return;
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = addWeeks(focusedDate, 1);
            setFocusedDate(next);
            if (!isSameMonth(next, viewDate)) setViewDate(next);
            return;
          }
          if (e.key === 'Enter') {
            e.preventDefault();
            onChange(format(focusedDate, valuePattern));
            setIsOpen(false);
          }
        }}
          className={clsx(
            'w-full h-10 rounded-xl border border-gray-200 bg-white px-3.5 pr-16 text-left text-sm shadow-sm transition-all duration-200',
            'hover:border-gray-300 hover:shadow focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:shadow-md',
            !renderedValue && 'text-gray-500',
          )}
        />
        <button
          type="button"
          aria-label={isOpen ? 'Tutup kalender' : 'Buka kalender'}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsOpen((open) => !open);
          }}
        >
          <CalendarDays className="h-4 w-4" />
        </button>
        {canClear && (
          <button
            type="button"
            aria-label="Clear selected date"
            className="absolute right-8 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            onMouseDown={(e) => {
              e.preventDefault();
              onChange('');
              setIsOpen(false);
            }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[18.5rem] rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewDate((d) => subMonths(d, 1))}
              className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <select
                value={viewDate.getMonth()}
                onChange={(e) => {
                  const nextMonth = Number(e.target.value);
                  const next = new Date(viewDate.getFullYear(), nextMonth, 1);
                  setViewDate(next);
                  setFocusedDate(next);
                }}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium capitalize text-gray-700"
              >
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <select
                value={viewDate.getFullYear()}
                onChange={(e) => {
                  const nextYear = Number(e.target.value);
                  const next = new Date(nextYear, viewDate.getMonth(), 1);
                  setViewDate(next);
                  setFocusedDate(next);
                }}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setViewDate((d) => addMonths(d, 1))}
              className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500">
            {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const inCurrentMonth = isSameMonth(day, viewDate);
              const isSelected = selectedDate != null && isSameDay(day, selectedDate);
              const isFocused = isSameDay(day, focusedDate);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => {
                    onChange(format(day, valuePattern));
                    setFocusedDate(day);
                    setIsOpen(false);
                  }}
                  className={clsx(
                    'h-8 rounded-md text-sm transition-colors focus:outline-none',
                    inCurrentMonth ? 'text-gray-800' : 'text-gray-300',
                    isSelected
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'hover:bg-gray-100',
                    isFocused && !isSelected && 'ring-2 ring-primary-300 ring-inset',
                  )}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              className="text-xs font-medium text-gray-500 hover:text-gray-700"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
              onClick={() => {
                const today = new Date();
                onChange(format(today, valuePattern));
                setViewDate(today);
                setFocusedDate(today);
                setIsOpen(false);
              }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
