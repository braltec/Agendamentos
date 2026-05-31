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
    <div className={clsx('px-6 py-4 border-b border-[var(--color-border)]', className)}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '' }) {
  return <div className={clsx('px-6 py-4', className)}>{children}</div>
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={clsx('px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface-muted)]', className)}>
      {children}
    </div>
  )
}
