import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bubble-user-bg)] disabled:opacity-50 disabled:pointer-events-none'

  const variants = {
    primary:
      'bg-[var(--bubble-user-bg)] text-[var(--bubble-user-fg)] hover:opacity-90 active:scale-[0.98]',
    ghost: 'hover:bg-[var(--muted)] text-[var(--foreground)]',
    outline:
      'border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]',
  }

  const sizes = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
