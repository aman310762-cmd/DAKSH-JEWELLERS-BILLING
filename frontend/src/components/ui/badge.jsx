import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors",
  {
    variants: {
      variant: {
        gold: "bg-gold-500/10 text-gold-400 border border-gold-500/15",
        emerald: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15",
        blue: "bg-blue-500/10 text-blue-400 border border-blue-500/15",
        purple: "bg-purple-500/10 text-purple-400 border border-purple-500/15",
        red: "bg-red-500/10 text-red-400 border border-red-500/15",
        neutral: "bg-white/[0.05] text-dark-300 border border-white/[0.08]",
      },
    },
    defaultVariants: {
      variant: "gold",
    },
  }
);

export function Badge({ className, variant, children, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  );
}
