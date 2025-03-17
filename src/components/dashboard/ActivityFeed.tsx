
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CheckSquare, FileText, MessageSquare, User, Users } from "lucide-react";

type ActivityType = "task" | "message" | "document" | "user" | "team";

interface Activity {
  id: string;
  type: ActivityType;
  content: string;
  timestamp: string;
  user: {
    name: string;
    avatar?: string;
  };
}

interface ActivityFeedProps {
  activities: Activity[];
  className?: string;
}

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "task":
        return <CheckSquare className="h-4 w-4 text-blue-500" />;
      case "message":
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case "document":
        return <FileText className="h-4 w-4 text-amber-500" />;
      case "user":
        return <User className="h-4 w-4 text-purple-500" />;
      case "team":
        return <Users className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-[16px] before:w-[1px] before:bg-border">
            {activities.map((activity) => (
              <div key={activity.id} className="relative pl-9">
                <div className="absolute left-0 rounded-full p-1 bg-background ring-1 ring-border">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="text-sm font-medium">{activity.content}</div>
                <div className="text-xs text-muted-foreground flex items-center mt-1">
                  <span>{activity.user.name}</span>
                  <span className="mx-1">•</span>
                  <span>{activity.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
