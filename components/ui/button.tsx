import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-red-600/30',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-red-600/30',
        outline:
          'border-2 border-border bg-card text-foreground hover:bg-foreground hover:text-background',
        secondary:
          'bg-foreground text-background hover:opacity-90',
        ghost:
          'hover:bg-muted text-foreground',
        link: 'text-red-600 underline-offset-4 hover:underline font-bold',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-12 rounded-lg px-6',
        icon: 'size-10',
        'icon-sm': 'size-9',
        'icon-lg': 'size-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
