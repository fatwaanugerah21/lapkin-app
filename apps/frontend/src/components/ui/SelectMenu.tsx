import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { clsx } from 'clsx';

export type SelectMenuOption = {
  value: string;
  label: string;
};

type SelectMenuProps = {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectMenuOption[];
  className?: string;
};

export function SelectMenu({
  label,
  placeholder = 'Pilih',
  value,
  onChange,
  options,
  className,
}: SelectMenuProps) {
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  useEffect(() => {
    const onDocumentMouseDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDocumentMouseDown);
    return () => document.removeEventListener('mousedown', onDocumentMouseDown);
  }, []);

  const selectedLabel = useMemo(
    () => options.find((option) => option.value === value)?.label,
    [options, value],
  );
  const menuOptions = useMemo(
    () => [{ value: '', label: placeholder }, ...options],
    [options, placeholder],
  );
  const canClear = value !== '';

  useEffect(() => {
    if (!open) return;
    const selectedIdx = menuOptions.findIndex((opt) => opt.value === value);
    setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0);
  }, [open, menuOptions, value]);

  return (
    <div ref={rootRef} className={clsx('relative flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <button
        id={inputId}
        type="button"
        onClick={() => setOpen((state) => !state)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false);
            return;
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!open) {
              setOpen(true);
              return;
            }
            setHighlightedIndex((idx) => Math.min(idx + 1, menuOptions.length - 1));
            return;
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (!open) {
              setOpen(true);
              return;
            }
            setHighlightedIndex((idx) => Math.max(idx - 1, 0));
            return;
          }
          if ((e.key === 'Enter' || e.key === ' ') && open) {
            e.preventDefault();
            const next = menuOptions[highlightedIndex];
            if (!next) return;
            onChange(next.value);
            setOpen(false);
          }
        }}
        className={clsx(
          'relative w-full h-10 rounded-xl border border-gray-200 bg-white px-3.5 pr-16 text-left text-sm text-gray-900 shadow-sm transition-all duration-200',
          'hover:border-gray-300 hover:shadow focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:shadow-md',
          !selectedLabel && 'text-gray-500',
        )}
      >
        {selectedLabel ?? placeholder}
        {canClear && (
          <span
            className="absolute right-8 top-1/2 -translate-y-1/2"
            onMouseDown={(e) => e.preventDefault()}
          >
            <button
              type="button"
              aria-label="Clear selected value"
              className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setOpen(false);
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </span>
        )}
        <ChevronDown
          className={clsx(
            'pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 transition-transform duration-200',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {open && (
        <ul className="absolute left-0 top-full z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
          {menuOptions.map((option, idx) => (
            <li key={option.value || '__placeholder__'}>
              <button
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={clsx(
                  'w-full rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                  idx === 0 ? 'hover:bg-gray-100' : 'hover:bg-primary-50',
                  highlightedIndex === idx && (idx === 0 ? 'bg-gray-100' : 'bg-primary-50'),
                  value === option.value
                  && (idx === 0 ? 'bg-gray-100 font-medium text-gray-800' : 'bg-primary-50 font-medium text-primary-900'),
                )}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
