
import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("card-transition overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground pt-1">{description}</p>
        )}
        {trend && trendValue && (
          <div className="flex items-center mt-2">
            <div
              className={cn(
                "text-xs font-medium rounded-full px-2 py-0.5 flex items-center gap-1",
                trend === "up"
                  ? "bg-green-500/10 text-green-600"
                  : trend === "down"
                  ? "bg-red-500/10 text-red-600"
                  : "bg-yellow-500/10 text-yellow-600"
              )}
            >
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
              {trendValue}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
