import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-red-600 selection:text-white h-10 w-full min-w-0 rounded-lg border-2 border-border bg-input px-4 py-2 text-base text-foreground shadow-sm transition-all outline-none file:inline-flex file:h-8 file:border-0 file:bg-red-600 file:text-white file:text-sm file:font-bold file:rounded-md disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm font-medium',
        'focus-visible:border-red-600 focus-visible:ring-red-600 focus-visible:ring-[3px]',
        'aria-invalid:ring-red-600/20 aria-invalid:border-red-600',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
