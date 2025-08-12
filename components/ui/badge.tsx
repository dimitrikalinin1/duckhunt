import type * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-lg border-2 px-3 py-1 text-xs font-bold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-all duration-300 shadow-lg",
  {
    variants: {
      variant: {
        default:
          "border-blue-500/50 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105",
        secondary:
          "border-slate-600 bg-slate-700/50 text-slate-300 shadow-slate-700/25 hover:shadow-slate-700/40 hover:scale-105",
        destructive:
          "border-red-500/50 bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-300 shadow-red-500/25 hover:shadow-red-500/40 hover:scale-105",
        outline: "border-slate-600 text-slate-300 bg-transparent hover:bg-slate-800/50 hover:scale-105",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
