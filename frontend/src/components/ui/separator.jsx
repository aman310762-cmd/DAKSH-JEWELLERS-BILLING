import { cn } from "../../lib/utils";

export function Separator({ className, orientation = "horizontal", ...props }) {
  return (
    <div
      className={cn(
        "shrink-0",
        orientation === "horizontal"
          ? "h-px w-full bg-gradient-to-r from-transparent via-gold-500/15 to-transparent"
          : "w-px h-full bg-gradient-to-b from-transparent via-gold-500/15 to-transparent",
        className
      )}
      role="separator"
      {...props}
    />
  );
}
