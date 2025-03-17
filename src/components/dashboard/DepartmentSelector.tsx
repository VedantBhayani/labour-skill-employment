
import React from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Users, BarChart3, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Department {
  id: string;
  name: string;
  employees: number;
  tasks: number;
  projects: number;
}

interface DepartmentSelectorProps {
  departments: Department[];
  activeDepartment: string;
  onDepartmentChange: (departmentId: string) => void;
  className?: string;
}

export function DepartmentSelector({
  departments,
  activeDepartment,
  onDepartmentChange,
  className,
}: DepartmentSelectorProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Department Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeDepartment} onValueChange={onDepartmentChange}>
          <TabsList className="grid grid-cols-3 mb-4">
            {departments.slice(0, 3).map((dept) => (
              <TabsTrigger key={dept.id} value={dept.id}>
                {dept.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {departments.map((dept) => (
            <TabsContent
              key={dept.id}
              value={dept.id}
              className="animate-fade-in"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-md">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Employees</div>
                    <div className="text-xl font-semibold">{dept.employees}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-md">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Tasks</div>
                    <div className="text-xl font-semibold">{dept.tasks}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-md">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Projects</div>
                    <div className="text-xl font-semibold">{dept.projects}</div>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
