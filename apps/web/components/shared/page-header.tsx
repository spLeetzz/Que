import * as React from "react";

import { cn } from "~/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "~/components/ui/card";

interface PageHeaderProps extends React.ComponentProps<typeof Card> {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/**
 * PageHeader - Composable page header using Card and Typography
 * 
 * A reusable header component for pages that provides consistent
 * styling and layout for page titles, descriptions, and actions.
 * 
 * @example
 * <PageHeader
 *   title="Events"
 *   description="Manage your forms, polls, and banter sessions"
 *   action={<Button>Create Event</Button>}
 * />
 */
function PageHeader({
  title,
  description,
  action,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <Card className={cn("shadow-none border-0", className)} {...props}>
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
    </Card>
  );
}

export { PageHeader };
export type { PageHeaderProps };
