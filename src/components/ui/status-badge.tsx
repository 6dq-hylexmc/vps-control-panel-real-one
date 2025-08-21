import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        running: "border-success/20 bg-success/10 text-success",
        stopped: "border-destructive/20 bg-destructive/10 text-destructive", 
        pending: "border-warning/20 bg-warning/10 text-warning",
        deploying: "border-primary/20 bg-primary/10 text-primary",
      },
    },
    defaultVariants: {
      variant: "stopped",
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {}

function StatusBadge({ className, variant, ...props }: StatusBadgeProps) {
  return (
    <div className={cn(statusBadgeVariants({ variant }), className)} {...props} />
  )
}

export { StatusBadge, statusBadgeVariants }