'use client';

import { useId, useState } from 'react';
import { Eye, EyeOff, X, CheckCircle2 } from 'lucide-react';

export default function Input({
  label,
  error,
  hint,
  leadingIcon,
  trailingIcon,
  success = false,
  className = '',
  wrapperClassName = '',
  type: typeProp = 'text',
  id,
  ...props
}) {
  const [showPw, setShowPw] = useState(false);
  const isPassword = typeProp === 'password';
  const inputType = isPassword ? (showPw ? 'text' : 'password') : typeProp;

  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descId = `${inputId}-desc`;

  const borderClass = error
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
    : 'border-[#E2E8F0] focus:ring-[#2563EB] focus:border-[#2563EB]';

  return (
    <div className={`flex flex-col gap-1 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#475569]">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {leadingIcon && (
          <span className="absolute left-3 text-[#94A3B8] pointer-events-none flex items-center">
            {leadingIcon}
          </span>
        )}

        <input
          id={inputId}
          type={inputType}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? descId : undefined}
          className={[
            'w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#0F172A] bg-white outline-none',
            'placeholder:text-[#94A3B8] transition-all',
            'focus:ring-2',
            'disabled:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:text-[#94A3B8]',
            borderClass,
            leadingIcon ? 'pl-10' : '',
            (trailingIcon || isPassword || success) ? 'pr-10' : '',
            className,
          ].join(' ')}
          {...props}
        />

        {/* Trailing slot */}
        <span className="absolute right-3 flex items-center gap-1">
          {success && !error && (
            <CheckCircle2 size={16} className="text-[#16A34A]" />
          )}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="text-[#94A3B8] hover:text-[#475569] transition-colors"
              tabIndex={-1}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
          {!isPassword && !success && trailingIcon && (
            <span className="text-[#94A3B8]">{trailingIcon}</span>
          )}
        </span>
      </div>

      {error && <p id={descId} className="text-xs text-red-500 flex items-center gap-1">{error}</p>}
      {hint && !error && <p id={descId} className="text-xs text-[#94A3B8]">{hint}</p>}
    </div>
  );
}

/** Styled select with the same visual language as Input */
export function Select({ label, error, hint, children, className = '', wrapperClassName = '', id, ...props }) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const descId = `${selectId}-desc`;

  return (
    <div className={`flex flex-col gap-1 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-[#475569]">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? descId : undefined}
        className={[
          'w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#0F172A] outline-none bg-white',
          'transition-all focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]',
          'disabled:bg-[#F1F5F9] disabled:cursor-not-allowed',
          error ? 'border-red-500' : 'border-[#E2E8F0]',
          className,
        ].join(' ')}
        {...props}
      >
        {children}
      </select>
      {error && <p id={descId} className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p id={descId} className="text-xs text-[#94A3B8]">{hint}</p>}
    </div>
  );
}
