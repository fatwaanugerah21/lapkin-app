import { InputHTMLAttributes, forwardRef, useId, type ChangeEvent } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  clearable?: boolean;
}

const baseClass =
  'w-full h-10 min-w-0 rounded-xl border bg-white px-3.5 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400';

const defaultState =
  'border-gray-200 hover:border-gray-300 hover:shadow';

const focusState =
  'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:shadow-md';

const disabledState =
  'disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none disabled:hover:border-gray-200';

const errorState =
  'border-red-400 bg-red-50/40 hover:border-red-400 focus:border-red-500 focus:ring-red-500/20';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, clearable = false, className, id, type, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const isNumber = type === 'number';
    const canClear =
      clearable
      && typeof props.value === 'string'
      && props.value.trim() !== ''
      && props.disabled !== true
      && props.readOnly !== true
      && typeof props.onChange === 'function';

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={clsx(
              baseClass,
              defaultState,
              focusState,
              disabledState,
              error && errorState,
              isNumber && 'input-number-no-spin tabular-nums',
              canClear && 'pr-9',
              className,
            )}
            {...props}
          />
          {canClear && (
            <button
              type="button"
              aria-label="Clear input value"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                props.onChange?.({
                  target: { value: '' },
                  currentTarget: { value: '' },
                } as ChangeEvent<HTMLInputElement>);
              }}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {error && (
          <span className="text-xs font-medium text-red-600" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
