import { clsx } from 'clsx'

function Card({ children, className = '', ...props }) {
  return (
    <div
      className={clsx(
        'bg-[var(--color-surface)] rounded-lg shadow-sm border border-[var(--color-border)]',
        'transition-shadow hover:shadow-md',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Card }
export default Card

export function CardHeader({ children, className = '' }) {
  return (
    <div className={clsx('px-4 py-4 sm:px-6 border-b border-[var(--color-border)]', className)}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '' }) {
  return <div className={clsx('px-4 py-4 sm:px-6', className)}>{children}</div>
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={clsx('px-4 py-4 sm:px-6 border-t border-[var(--color-border)] bg-[var(--color-surface-muted)]', className)}>
      {children}
    </div>
  )
}
