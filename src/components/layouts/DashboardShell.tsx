import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: ReactNode;
  className?: string;
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <div className={cn("flex-1 space-y-4 p-8 pt-6", className)}>
      {children}
    </div>
  );
} 