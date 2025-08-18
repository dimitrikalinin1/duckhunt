import type * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-black tracking-wide transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background border-2 shadow-xl hover:shadow-2xl transform-gpu",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary to-secondary text-primary-foreground border-primary/30 shadow-primary/30 hover:from-primary/90 hover:to-secondary/90 hover:scale-105 hover:shadow-primary/50 active:scale-95 hover:border-primary/50",
        destructive:
          "bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground border-destructive/30 shadow-destructive/30 hover:from-destructive/90 hover:to-destructive/70 hover:scale-105 hover:shadow-destructive/50 active:scale-95 hover:border-destructive/50",
        outline:
          "border-2 border-border bg-gradient-to-br from-background/80 to-muted/50 text-foreground shadow-border/20 hover:bg-gradient-to-br hover:from-accent/20 hover:to-secondary/10 hover:text-accent-foreground hover:scale-105 hover:border-accent/50 active:scale-95 backdrop-blur-sm",
        secondary:
          "bg-gradient-to-r from-secondary to-accent text-secondary-foreground border-secondary/30 shadow-secondary/30 hover:from-secondary/90 hover:to-accent/90 hover:scale-105 hover:shadow-secondary/50 active:scale-95 hover:border-secondary/50",
        ghost:
          "text-foreground border-transparent hover:bg-gradient-to-br hover:from-accent/20 hover:to-primary/10 hover:text-accent-foreground hover:scale-105 hover:border-accent/30 active:scale-95 backdrop-blur-sm",
        link: "text-primary underline-offset-4 hover:underline hover:text-secondary border-transparent shadow-none hover:shadow-none",
      },
      size: {
        default: "h-12 px-8 py-3 has-[>svg]:px-6 text-base",
        sm: "h-10 rounded-lg gap-1.5 px-6 has-[>svg]:px-4 text-sm",
        lg: "h-14 rounded-xl px-10 has-[>svg]:px-8 text-lg font-black",
        icon: "size-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
