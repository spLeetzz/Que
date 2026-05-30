import { cn } from "~/lib/utils";

interface LogoProps {
  variant?: "default" | "icon" | "text";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ variant = "default", size = "md", className }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6 text-base",
    md: "h-8 w-8 text-xl",
    lg: "h-10 w-10 text-2xl",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl",
  };

  if (variant === "icon") {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold tracking-tight",
          sizeClasses[size],
          className
        )}
      >
        Q
      </div>
    );
  }

  if (variant === "text") {
    return (
      <span className={cn("font-bold tracking-tight", textSizeClasses[size], className)}>
        Que
      </span>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold tracking-tight",
          sizeClasses[size]
        )}
      >
        Q
      </div>
      <span className={cn("font-bold tracking-tight", textSizeClasses[size])}>Que</span>
    </div>
  );
}
