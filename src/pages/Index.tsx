import React, { useState, useEffect } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { TasksList } from "@/components/dashboard/TasksList";
import { DepartmentSelector } from "@/components/dashboard/DepartmentSelector";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { 
  Users, 
  BarChart3, 
  CheckSquare, 
  MessageCircle, 
  AlertCircle, 
  RefreshCw 
} from "lucide-react";
import { PluginSlot } from "@/components/PluginSlot";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePredictiveAnalytics } from "@/components/PredictiveAnalyticsProvider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const departmentsData = [
  {
    id: "hr",
    name: "HR",
    employees: 12,
    tasks: 24,
    projects: 3,
  },
  {
    id: "sales",
    name: "Sales",
    employees: 18,
    tasks: 32,
    projects: 5,
  },
  {
    id: "dev",
    name: "Development",
    employees: 26,
    tasks: 48,
    projects: 7,
  },
];

const tasksData = [
  {
    id: "task1",
    title: "Update department overview dashboard",
    description: "Implement new data visualization for the HR department dashboard",
    status: "in-progress" as const,
    dueDate: "Tomorrow",
    department: "Development",
    priority: "high" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "task2",
    title: "Review quarterly performance metrics",
    description: "Analyze and prepare summary of Q3 performance data for all departments",
    status: "pending" as const,
    dueDate: "Next week",
    department: "HR",
    priority: "medium" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "task3",
    title: "Prepare communication hub documentation",
    description: "Create user guide for the new messaging and notification system",
    status: "completed" as const,
    dueDate: "Yesterday",
    department: "Sales",
    priority: "low" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "task4",
    title: "Task assignment system update",
    description: "Implement new features for task tracking and assignment workflow",
    status: "in-progress" as const,
    dueDate: "3 days",
    department: "Development",
    priority: "medium" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
];

const activitiesData = [
  {
    id: "act1",
    type: "task" as const,
    content: "New task assigned: Quarterly report review",
    timestamp: "10 minutes ago",
    user: { name: "John Smith" },
  },
  {
    id: "act2",
    type: "message" as const,
    content: "New message in HR channel",
    timestamp: "25 minutes ago",
    user: { name: "Sarah Johnson" },
  },
  {
    id: "act3",
    type: "document" as const,
    content: "Updated project documentation",
    timestamp: "1 hour ago",
    user: { name: "Mike Chen" },
  },
  {
    id: "act4",
    type: "team" as const,
    content: "Created new team: Data Analytics",
    timestamp: "2 hours ago",
    user: { name: "Ana Rodriguez" },
  },
  {
    id: "act5",
    type: "user" as const,
    content: "New member joined: Technical Writer",
    timestamp: "3 hours ago",
    user: { name: "Raj Patel" },
  },
  {
    id: "act6",
    type: "task" as const,
    content: "Completed task: System maintenance",
    timestamp: "5 hours ago",
    user: { name: "Leila Wong" },
  },
];

const performanceData = [
  { name: "Jan", HR: 65, Sales: 78, Development: 82 },
  { name: "Feb", HR: 59, Sales: 85, Development: 77 },
  { name: "Mar", HR: 80, Sales: 88, Development: 90 },
  { name: "Apr", HR: 81, Sales: 70, Development: 93 },
  { name: "May", HR: 76, Sales: 67, Development: 85 },
  { name: "Jun", HR: 84, Sales: 80, Development: 89 },
];

const taskDistributionData = [
  { name: "Completed", value: 35 },
  { name: "In Progress", value: 45 },
  { name: "Pending", value: 20 },
];

const departmentProgressData = [
  { name: "HR", Tasks: 24, Projects: 3 },
  { name: "Sales", Tasks: 32, Projects: 5 },
  { name: "Dev", Tasks: 48, Projects: 7 },
  { name: "Marketing", Tasks: 28, Projects: 4 },
  { name: "Finance", Tasks: 15, Projects: 2 },
];

// Analytics Error Handler Component
const AnalyticsErrorHandler = ({ onRetry }) => {
  // Check if we're in offline mode
  const isOffline = localStorage.getItem('analytics_offline_mode') === 'true';
  
  return (
    <Alert className={`mb-6 ${isOffline ? 'bg-amber-50 border-amber-200' : 'bg-destructive/15'}`}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{isOffline ? 'Using offline mode' : 'Analytics data could not be loaded'}</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>
          {isOffline 
            ? 'No connection to analytics server. Using local data instead.'
            : 'Using cached data. Some statistics may not be up-to-date.'}
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-fit flex items-center gap-2"
          onClick={onRetry}
        >
          <RefreshCw className="h-4 w-4" />
          {isOffline ? 'Try to connect' : 'Retry'}
        </Button>
      </AlertDescription>
    </Alert>
  );
};

const Index = () => {
  const [activeDepartment, setActiveDepartment] = useState("hr");
  const { hasError, refreshData } = usePredictiveAnalytics();

  const handleRetryAnalytics = () => {
    refreshData();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome to your integrated dashboard overview.
        </p>
      </div>
      
      {hasError && <AnalyticsErrorHandler onRetry={handleRetryAnalytics} />}
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <StatCard
          title="Total Employees"
          value="78"
          icon={Users}
          trend="up"
          trendValue="12% from last month"
          className="animate-fade-in [animation-delay:100ms]"
        />
        <StatCard
          title="Active Tasks"
          value="45"
          icon={CheckSquare}
          trend="down"
          trendValue="3% from last week"
          className="animate-fade-in [animation-delay:200ms]"
        />
        <StatCard
          title="Departments"
          value="8"
          icon={BarChart3}
          className="animate-fade-in [animation-delay:300ms]"
        />
        <StatCard
          title="Messages"
          value="128"
          icon={MessageCircle}
          trend="up"
          trendValue="24% from last week"
          className="animate-fade-in [animation-delay:400ms]"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Department Performance"
          type="line"
          data={performanceData}
          dataKey="value"
          categories={["HR", "Sales", "Development"]}
          className="animate-fade-in [animation-delay:500ms]"
        />
        <ChartCard
          title="Task Distribution"
          type="pie"
          data={taskDistributionData}
          dataKey="value"
          className="animate-fade-in [animation-delay:600ms]"
        />
      </div>

      {/* Plugin Dashboard Widgets Section */}
      <div className="animate-fade-in [animation-delay:650ms]">
        <h2 className="text-xl font-semibold mb-4">Plugin Widgets</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <PluginSlot 
            name="dashboard.widgets" 
            fallback={
              <Card>
                <CardHeader>
                  <CardTitle>No Plugin Widgets</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    No plugin widgets are currently available. Install and enable plugins to see widgets here.
                  </p>
                </CardContent>
              </Card>
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <TasksList 
          tasks={tasksData} 
          className="lg:col-span-2 animate-fade-in [animation-delay:700ms]" 
        />
        <div className="space-y-6">
          <DepartmentSelector
            departments={departmentsData}
            activeDepartment={activeDepartment}
            onDepartmentChange={setActiveDepartment}
            className="animate-fade-in [animation-delay:800ms]"
          />
          <ActivityFeed 
            activities={activitiesData} 
            className="animate-fade-in [animation-delay:900ms]" 
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
