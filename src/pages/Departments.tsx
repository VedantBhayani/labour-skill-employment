
import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { Users, Building, BarChart3, Briefcase } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const departmentsData = [
  {
    id: "hr",
    name: "HR",
    employees: 12,
    tasks: 24,
    projects: 3,
    managers: ["Sarah Johnson", "Michael Lee"],
    progress: 68,
    description: "Human Resources department handling recruiting and employee welfare",
  },
  {
    id: "sales",
    name: "Sales",
    employees: 18,
    tasks: 32,
    projects: 5,
    managers: ["David Smith", "Jennifer Williams"],
    progress: 75,
    description: "Sales department handling customer acquisition and revenue generation",
  },
  {
    id: "dev",
    name: "Development",
    employees: 26,
    tasks: 48,
    projects: 7,
    managers: ["Alex Chen", "Emma Davis"],
    progress: 82,
    description: "Software development team building and maintaining our products",
  },
  {
    id: "marketing",
    name: "Marketing",
    employees: 14,
    tasks: 28,
    projects: 4,
    managers: ["Robert Taylor", "Sophia Wilson"],
    progress: 59,
    description: "Marketing team handling brand awareness and lead generation",
  },
  {
    id: "finance",
    name: "Finance",
    employees: 8,
    tasks: 15,
    projects: 2,
    managers: ["Laura Garcia", "Daniel Brown"],
    progress: 80,
    description: "Finance team handling budgeting and financial planning",
  },
];

const departmentTeamMembers = {
  hr: [
    { id: 1, name: "Sarah Johnson", role: "HR Director", avatar: "SJ" },
    { id: 2, name: "Michael Lee", role: "HR Manager", avatar: "ML" },
    { id: 3, name: "Emily White", role: "Recruiter", avatar: "EW" },
    { id: 4, name: "James Roberts", role: "HR Specialist", avatar: "JR" },
  ],
  sales: [
    { id: 1, name: "David Smith", role: "Sales Director", avatar: "DS" },
    { id: 2, name: "Jennifer Williams", role: "Sales Manager", avatar: "JW" },
    { id: 3, name: "Thomas Brown", role: "Account Executive", avatar: "TB" },
    { id: 4, name: "Amanda Miller", role: "Sales Representative", avatar: "AM" },
  ],
  dev: [
    { id: 1, name: "Alex Chen", role: "CTO", avatar: "AC" },
    { id: 2, name: "Emma Davis", role: "Development Lead", avatar: "ED" },
    { id: 3, name: "Ryan Wilson", role: "Senior Developer", avatar: "RW" },
    { id: 4, name: "Olivia Martin", role: "Frontend Developer", avatar: "OM" },
  ],
  marketing: [
    { id: 1, name: "Robert Taylor", role: "Marketing Director", avatar: "RT" },
    { id: 2, name: "Sophia Wilson", role: "Marketing Manager", avatar: "SW" },
    { id: 3, name: "Daniel Garcia", role: "Content Strategist", avatar: "DG" },
    { id: 4, name: "Isabella Lopez", role: "Social Media Specialist", avatar: "IL" },
  ],
  finance: [
    { id: 1, name: "Laura Garcia", role: "Finance Director", avatar: "LG" },
    { id: 2, name: "Daniel Brown", role: "Financial Controller", avatar: "DB" },
    { id: 3, name: "Natalie Clark", role: "Accountant", avatar: "NC" },
    { id: 4, name: "Kevin Young", role: "Financial Analyst", avatar: "KY" },
  ],
};

const departmentPerformanceData = [
  { name: "Jan", HR: 65, Sales: 78, Development: 82, Marketing: 58, Finance: 71 },
  { name: "Feb", HR: 59, Sales: 85, Development: 77, Marketing: 62, Finance: 68 },
  { name: "Mar", HR: 80, Sales: 88, Development: 90, Marketing: 70, Finance: 82 },
  { name: "Apr", HR: 81, Sales: 70, Development: 93, Marketing: 65, Finance: 78 },
  { name: "May", HR: 76, Sales: 67, Development: 85, Marketing: 80, Finance: 74 },
  { name: "Jun", HR: 84, Sales: 80, Development: 89, Marketing: 71, Finance: 86 },
];

const Departments = () => {
  const [activeDepartment, setActiveDepartment] = useState("hr");

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Department Overview</h1>
          <p className="text-muted-foreground mt-1">
            Manage and analyze department performance and resources.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <StatCard
            title="Total Departments"
            value="5"
            icon={Building}
            className="animate-fade-in [animation-delay:100ms]"
          />
          <StatCard
            title="Total Employees"
            value="78"
            icon={Users}
            trend="up"
            trendValue="12% from last month"
            className="animate-fade-in [animation-delay:200ms]"
          />
          <StatCard
            title="Active Projects"
            value="21"
            icon={Briefcase}
            trend="up"
            trendValue="5% from last month"
            className="animate-fade-in [animation-delay:300ms]"
          />
          <StatCard
            title="Department Growth"
            value="18%"
            icon={BarChart3}
            trend="up"
            trendValue="3% from last year"
            className="animate-fade-in [animation-delay:400ms]"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 animate-fade-in [animation-delay:500ms]">
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
              <CardDescription>
                Compare performance metrics across departments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartCard
                title=""
                type="line"
                data={departmentPerformanceData}
                dataKey="value"
                categories={["HR", "Sales", "Development", "Marketing", "Finance"]}
                className="h-[350px]"
              />
            </CardContent>
          </Card>

          <Card className="animate-fade-in [animation-delay:600ms]">
            <CardHeader>
              <CardTitle>Departments</CardTitle>
              <CardDescription>
                Select a department to view details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs 
                defaultValue={activeDepartment} 
                onValueChange={setActiveDepartment}
                className="w-full"
              >
                <TabsList className="grid grid-cols-5">
                  {departmentsData.map((dept) => (
                    <TabsTrigger key={dept.id} value={dept.id}>
                      {dept.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {departmentsData.map((dept) => (
                  <TabsContent key={dept.id} value={dept.id} className="space-y-4 mt-4">
                    <div>
                      <h3 className="text-lg font-medium">{dept.name} Department</h3>
                      <p className="text-sm text-muted-foreground mt-1">{dept.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-muted/30 p-3 rounded-md text-center">
                        <p className="text-sm text-muted-foreground">Employees</p>
                        <p className="text-xl font-bold">{dept.employees}</p>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-md text-center">
                        <p className="text-sm text-muted-foreground">Projects</p>
                        <p className="text-xl font-bold">{dept.projects}</p>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-md text-center">
                        <p className="text-sm text-muted-foreground">Tasks</p>
                        <p className="text-xl font-bold">{dept.tasks}</p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">Project Progress</p>
                        <p className="text-sm font-medium">{dept.progress}%</p>
                      </div>
                      <Progress value={dept.progress} className="h-2 mt-1" />
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Management</p>
                      <div className="flex gap-2 flex-wrap">
                        {dept.managers.map((manager, idx) => (
                          <Badge key={idx} variant="outline">{manager}</Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <Card className="animate-fade-in [animation-delay:700ms]">
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Employees from the {departmentsData.find(d => d.id === activeDepartment)?.name} department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {departmentTeamMembers[activeDepartment as keyof typeof departmentTeamMembers].map((member) => (
                <div key={member.id} className="border rounded-lg p-4 flex flex-col items-center text-center space-y-2 hover:border-primary transition-all">
                  <div className="bg-primary/10 text-primary font-semibold flex items-center justify-center w-12 h-12 rounded-full">
                    {member.avatar}
                  </div>
                  <div>
                    <h4 className="font-medium">{member.name}</h4>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Departments;
