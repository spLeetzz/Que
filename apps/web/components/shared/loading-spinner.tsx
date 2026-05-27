import * as React from "react";
import { Loader2Icon } from "lucide-react";

import { cn } from "~/lib/utils";

interface LoadingSpinnerProps extends React.ComponentProps<"div"> {
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeClasses = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
};

/**
 * LoadingSpinner - Loading indicator using Lucide icons
 * 
 * A reusable loading spinner component with configurable size
 * and optional label for accessibility.
 * 
 * @example
 * <LoadingSpinner size="md" label="Loading events..." />
 * 
 * @example
 * <LoadingSpinner size="lg" className="text-primary" />
 */
function LoadingSpinner({
  size = "md",
  label,
  className,
  ...props
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn("flex items-center justify-center gap-2", className)}
      suppressHydrationWarning={true}
      {...props}
    >
      <Loader2Icon
        role="status"
        aria-label={label || "Loading"}
        className={cn("animate-spin text-muted-foreground", sizeClasses[size])}
        suppressHydrationWarning={true}
      />
      {label && (
        <span className="text-sm text-muted-foreground" suppressHydrationWarning={true}>{label}</span>
      )}
    </div>
  );
}

export { LoadingSpinner };
export type { LoadingSpinnerProps };
