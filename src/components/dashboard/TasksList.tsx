
import React from "react";
import { CheckCircle2, AlertCircle, Clock, MoreHorizontal } from "lucide-react";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TaskStatus = "completed" | "in-progress" | "pending";

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  department: string;
  priority: "high" | "medium" | "low";
}

interface TasksListProps {
  tasks: Task[];
  className?: string;
}

export function TasksList({ tasks, className }: TasksListProps) {
  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "pending":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-600 hover:bg-red-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20";
      case "low":
        return "bg-green-500/10 text-green-600 hover:bg-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20";
    }
  };

  return (
    <Card className={cn("animate-fade-in", className)}>
      <CardHeader>
        <CardTitle>Recent Tasks</CardTitle>
        <CardDescription>Your assigned and ongoing tasks.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-4 hover:bg-muted/50 transition-colors group relative overflow-hidden"
            >
              <div className="absolute inset-y-0 left-0 w-1 bg-primary transform scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></div>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getStatusIcon(task.status)}</div>
                  <div>
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {task.description}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {task.department}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={cn("text-xs", getPriorityColor(task.priority))}
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">
                    Due {task.dueDate}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md border transition-colors hover:bg-muted">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Mark as completed</DropdownMenuItem>
                      <DropdownMenuItem>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
