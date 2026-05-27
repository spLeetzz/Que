import * as React from "react";

import { cn } from "~/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";

interface EmptyStateProps extends React.ComponentProps<typeof Card> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * EmptyState - Composable empty state using Card and Button
 * 
 * A reusable component for displaying empty states with optional
 * icon, title, description, and call-to-action button.
 * 
 * @example
 * <EmptyState
 *   icon={<FileTextIcon className="size-12 text-muted-foreground" />}
 *   title="No events yet"
 *   description="Get started by creating your first event"
 *   action={{
 *     label: "Create Event",
 *     onClick: () => console.log("Create event")
 *   }}
 * />
 */
function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <Card
      className={cn("flex flex-col items-center justify-center py-12", className)}
      {...props}
    >
      {icon && (
        <CardHeader className="pb-4">
          <div className="flex justify-center">{icon}</div>
        </CardHeader>
      )}
      <CardContent className="text-center space-y-2">
        <CardTitle className="text-xl">{title}</CardTitle>
        {description && (
          <CardDescription className="max-w-md">{description}</CardDescription>
        )}
      </CardContent>
      {action && (
        <CardFooter className="pt-4">
          <Button onClick={action.onClick}>{action.label}</Button>
        </CardFooter>
      )}
    </Card>
  );
}

export { EmptyState };
export type { EmptyStateProps };
