import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const Select = forwardRef(({ className, label, children, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="text-xs text-dark-400 mb-1.5 block font-medium">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          "input-gold w-full px-4 py-3 rounded-xl text-sm appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20width%3d%2212%22%20height%3d%2212%22%20viewBox%3d%220%200%2024%2024%22%20fill%3d%22none%22%20stroke%3d%22%23666%22%20stroke-width%3d%222%22%3e%3cpath%20d%3d%22M6%209l6%206%206-6%22%2f%3e%3c%2fsvg%3e')] bg-no-repeat bg-[right_12px_center]",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
});

Select.displayName = "Select";

export { Select };
