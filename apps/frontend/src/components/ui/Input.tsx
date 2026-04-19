import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const baseClass =
  'w-full min-w-0 rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400';

const defaultState =
  'border-gray-200 hover:border-gray-300 hover:shadow';

const focusState =
  'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:shadow-md';

const disabledState =
  'disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none disabled:hover:border-gray-200';

const errorState =
  'border-red-400 bg-red-50/40 hover:border-red-400 focus:border-red-500 focus:ring-red-500/20';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, type, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const isNumber = type === 'number';

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
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
            className,
          )}
          {...props}
        />
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
