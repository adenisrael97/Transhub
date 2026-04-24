'use client';

export default function Input({
  label,
  error,
  hint,
  className = '',
  wrapperClassName = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1 ${wrapperClassName}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-gray-900 outline-none
          placeholder:text-gray-400 transition-all
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${error ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-200'}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

/** Styled <select> with the same visual language as Input */
export function Select({ label, error, hint, children, className = '', wrapperClassName = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1 ${wrapperClassName}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-gray-900 outline-none bg-white
          transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${error ? 'border-red-400' : 'border-gray-200'} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
