import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/30",
  {
    variants: {
      variant: {
        gold: "btn-gold",
        ghost:
          "bg-transparent text-dark-300 hover:text-gold-400 hover:bg-white/[0.04]",
        outline:
          "border border-gold-500/20 text-gold-400 bg-transparent hover:bg-gold-500/10 hover:border-gold-500/40",
        soft:
          "bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 border border-gold-500/10 hover:border-gold-500/25",
        danger:
          "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/10",
        success:
          "bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold hover:shadow-lg hover:shadow-[#25D366]/20",
      },
      size: {
        xs: "px-2.5 py-1.5 text-xs rounded-lg",
        sm: "px-3.5 py-2 text-xs",
        md: "px-5 py-2.5 text-sm",
        lg: "px-6 py-3 text-sm",
        xl: "px-8 py-4 text-base",
        icon: "w-9 h-9 p-0",
      },
    },
    defaultVariants: {
      variant: "gold",
      size: "md",
    },
  }
);

export function Button({ className, variant, size, children, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
}

export { buttonVariants };
