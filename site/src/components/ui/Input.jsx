import { clsx } from 'clsx'
import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  { label, error, className = '', type = 'text', ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
          {label}
          {props.required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={clsx(
          'min-h-11 w-full px-3 py-2 text-base sm:px-4 sm:text-sm border rounded-lg transition-colors',
          'bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)]',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          'disabled:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed',
          error
            ? 'border-danger focus:ring-danger'
            : 'border-[var(--color-input-border)] hover:border-[var(--color-input-border-hover)]',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  )
})

export { Input }
export default Input
