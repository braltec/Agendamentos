import { clsx } from 'clsx'

const variants = {
  primary: 'bg-primary hover:bg-primary-dark text-white',
  secondary: 'bg-secondary hover:bg-secondary-600 text-white',
  outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
  danger: 'bg-danger hover:bg-red-600 text-white',
  ghost: 'hover:bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]',
}

const sizes = {
  sm: 'min-h-10 px-3 py-2 text-sm',
  md: 'min-h-11 px-4 py-2 text-base sm:text-sm',
  lg: 'min-h-12 px-6 py-3 text-base sm:text-lg',
}

function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  ...props
}) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200',
        'min-w-0 text-center leading-tight',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[var(--color-bg)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  )
}

export { Button }
export default Button
