import * as React from 'react'
import { cn } from '@/lib/utils'

const fieldClassName =
  'flex w-full rounded-lg border border-input bg-card px-3.5 py-2 text-base transition-[border-color,box-shadow] duration-150 ease-[var(--ease-out)] placeholder:text-muted-foreground/80 hover:border-foreground/20 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:border-input disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-destructive sm:text-sm'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(fieldClassName, 'h-11', className)}
      ref={ref}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export { Input }
