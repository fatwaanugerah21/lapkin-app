import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

export type SearchableSelectOption = {
  value: string;
  label: string;
  /** Lowercase string used for filtering (e.g. name + nip). */
  searchHaystack: string;
};

type SearchableSelectProps = {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  className?: string;
};

export function SearchableSelect({
  label,
  placeholder = 'Semua pegawai',
  value,
  onChange,
  options,
  className,
}: SearchableSelectProps) {
  const inputId = useId();
  const listId = `${inputId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const filtered = useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t) return options;
    const qCompact = t.replace(/\s/g, '');
    return options.filter((o) => {
      const h = o.searchHaystack.replace(/\s/g, '');
      return h.includes(qCompact) || o.label.toLowerCase().includes(t);
    });
  }, [options, query]);
  const selectableValues = useMemo(() => ['', ...filtered.map((opt) => opt.value)], [filtered]);

  const closeDropdown = () => {
    setOpen(false);
    setQuery('');
    setHighlightedIndex(0);
  };

  const selectValue = (nextValue: string) => {
    onChange(value === nextValue ? '' : nextValue);
    closeDropdown();
  };

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      closeDropdown();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (!open) return;
    const selectedIndex = selectableValues.indexOf(value);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [open, value, selectableValues]);

  useEffect(() => {
    if (!open) return;
    const activeEl = document.getElementById(`${inputId}-option-${highlightedIndex}`);
    if (!activeEl) return;
    activeEl.scrollIntoView({ block: 'nearest' });
  }, [open, highlightedIndex, inputId]);

  const inputValue = open ? query : (selected?.label ?? '');
  const showMuted = !selected && !open;

  return (
    <div ref={rootRef} className={clsx('relative flex flex-col gap-1.5', className)}>
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open ? `${inputId}-option-${highlightedIndex}` : undefined}
          autoComplete="off"
          placeholder={placeholder}
          className={clsx(
            'w-full min-w-0 rounded-xl border bg-white py-2 pl-3 pr-9 text-sm shadow-sm transition-all duration-200',
            'border-gray-200 hover:border-gray-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
            showMuted && 'text-gray-500 placeholder:text-gray-400',
          )}
          value={inputValue}
          onChange={(e) => {
            if (!open) setOpen(true);
            setQuery(e.target.value);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              closeDropdown();
              return;
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              if (!open) {
                setOpen(true);
                setQuery('');
                return;
              }
              setHighlightedIndex((prev) => Math.min(prev + 1, selectableValues.length - 1));
              return;
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              if (!open) {
                setOpen(true);
                setQuery('');
                return;
              }
              setHighlightedIndex((prev) => Math.max(prev - 1, 0));
              return;
            }
            if (e.key === 'Enter' && open) {
              e.preventDefault();
              const nextValue = selectableValues[highlightedIndex];
              if (nextValue !== undefined) selectValue(nextValue);
            }
          }}
        />
        <button
          type="button"
          aria-label={open ? 'Tutup pilihan' : 'Buka pilihan'}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600"
          onMouseDown={(e) => {
            e.preventDefault();
            const nextOpen = !open;
            setOpen(nextOpen);
            if (nextOpen) setQuery('');
            else closeDropdown();
            inputRef.current?.focus();
          }}
        >
          <ChevronDown
            className={clsx(
              'h-4 w-4 transition-transform duration-200',
              open && 'rotate-180',
            )}
            aria-hidden
          />
        </button>
        {open && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
          >
            <li role="presentation" className="px-1">
              <button
                type="button"
                role="option"
                aria-selected={value === ''}
                id={`${inputId}-option-0`}
                className={clsx(
                  'flex w-full rounded-lg px-2.5 py-1.5 text-left text-sm text-gray-600 hover:bg-gray-100',
                  highlightedIndex === 0 && 'bg-gray-100',
                )}
                onMouseEnter={() => setHighlightedIndex(0)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectValue('');
                }}
              >
                {placeholder}
              </button>
            </li>
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-gray-500">Tidak ada hasil</li>
            ) : (
              filtered.map((opt, idx) => (
                <li key={opt.value} role="presentation" className="px-1">
                  <button
                    type="button"
                    role="option"
                    aria-selected={value === opt.value}
                    id={`${inputId}-option-${idx + 1}`}
                    className={clsx(
                      'flex w-full rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-primary-50',
                      highlightedIndex === idx + 1 && 'bg-primary-50',
                      value === opt.value && 'bg-primary-50 font-medium text-primary-900',
                    )}
                    onMouseEnter={() => setHighlightedIndex(idx + 1)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectValue(opt.value);
                    }}
                  >
                    {opt.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
