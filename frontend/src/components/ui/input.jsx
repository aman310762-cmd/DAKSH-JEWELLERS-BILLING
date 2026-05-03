import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const Input = forwardRef(({ className, type = "text", label, hint, error, icon: Icon, prefix, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="text-xs text-dark-400 mb-1.5 block font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none"
          />
        )}
        {prefix && (
          <span className="absolute left-0 top-0 bottom-0 inline-flex items-center px-3.5 rounded-l-xl bg-dark-700/80 border border-r-0 border-gold-500/15 text-dark-400 text-sm font-medium pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            "input-gold w-full px-4 py-3 rounded-xl text-sm",
            Icon && "pl-10",
            prefix && "pl-16 rounded-l-none",
            error && "border-red-500/40 focus:border-red-500/60 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]",
            className
          )}
          {...props}
        />
      </div>
      {hint && !error && (
        <p className="text-[10px] text-dark-600 mt-1.5">{hint}</p>
      )}
      {error && (
        <p className="text-[10px] text-red-400 mt-1.5">{error}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export { Input };
