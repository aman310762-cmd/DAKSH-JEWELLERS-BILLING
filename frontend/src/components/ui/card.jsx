import { cn } from "../../lib/utils";

export function Card({ className, children, hover = false, glow = false, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gold-500/10 bg-[rgba(16,16,16,0.88)] backdrop-blur-[28px] shadow-[0_4px_30px_rgba(0,0,0,0.3)]",
        hover && "transition-all duration-400 hover:translate-y-[-4px] hover:border-gold-500/30 hover:shadow-[0_16px_50px_rgba(212,168,16,0.08),0_4px_15px_rgba(0,0,0,0.3)]",
        glow && "animate-border-glow",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn("px-6 pt-6 pb-2", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, icon: Icon, ...props }) {
  return (
    <h2
      className={cn(
        "text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2",
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="w-7 h-7 rounded-lg bg-gold-500/15 flex items-center justify-center">
          <Icon size={14} className="text-gold-400" />
        </div>
      )}
      {children}
    </h2>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn("px-6 pb-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn("px-6 pb-6 pt-2 border-t border-white/[0.05]", className)}
      {...props}
    >
      {children}
    </div>
  );
}
