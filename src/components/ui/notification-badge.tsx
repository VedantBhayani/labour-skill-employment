import React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const notificationBadgeVariants = cva(
  "absolute inline-flex items-center justify-center rounded-full text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "bg-background text-foreground border border-input",
      },
      size: {
        default: "h-5 w-5 -right-2 -top-2",
        sm: "h-4 w-4 -right-1 -top-1",
        lg: "h-6 w-6 -right-2 -top-2",
        dot: "h-2 w-2 right-0.5 top-0.5",
      },
      position: {
        default: "-right-2 -top-2",
        topRight: "-right-2 -top-2",
        topLeft: "-left-2 -top-2",
        bottomRight: "-right-2 -bottom-2",
        bottomLeft: "-left-2 -bottom-2",
        inline: "static ml-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      position: "default",
    },
  }
);

export interface NotificationBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof notificationBadgeVariants> {
  count?: number;
  max?: number;
  showZero?: boolean;
  dot?: boolean;
}

const NotificationBadge = React.forwardRef<HTMLDivElement, NotificationBadgeProps>(
  ({ className, variant, size, position, count = 0, max = 99, showZero = false, dot = false, ...props }, ref) => {
    // Don't render if count is 0 and showZero is false
    if (count === 0 && !showZero && !dot) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          notificationBadgeVariants({ variant, size: dot ? "dot" : size, position }),
          className
        )}
        {...props}
      >
        {!dot && (count > max ? `${max}+` : count)}
      </div>
    );
  }
);

NotificationBadge.displayName = "NotificationBadge";

export { NotificationBadge, notificationBadgeVariants }; 