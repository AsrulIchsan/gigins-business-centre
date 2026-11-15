import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-emerald-600 text-white shadow hover:bg-emerald-700",
        secondary:
          "border-transparent bg-slate-100 text-slate-800 hover:bg-slate-200",
        destructive:
          "border-transparent bg-rose-600 text-white shadow hover:bg-rose-700",
        warning:
          "border-transparent bg-amber-500 text-white shadow hover:bg-amber-600",
        outline: "text-foreground",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-800",
        cyan:
          "border-cyan-200 bg-cyan-50 text-cyan-800",
        purple:
          "border-purple-200 bg-purple-50 text-purple-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
