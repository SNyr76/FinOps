import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

export const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' }>(function Button({ className, variant = 'default', ...props }, ref) {
  return <button ref={ref} className={cn('inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold transition', variant === 'default' && 'bg-navy text-white hover:bg-navy/90', variant === 'outline' && 'border border-line bg-white text-muted hover:bg-slate-50', variant === 'ghost' && 'text-muted hover:bg-slate-50 hover:text-ink', className)} {...props} />
})
