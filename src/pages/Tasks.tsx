
import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { TasksList } from "@/components/dashboard/TasksList";
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  Plus, 
  Filter, 
  Search,
  SortAsc
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Task data with proper types
const tasksData = [
  {
    id: "task1",
    title: "Update department overview dashboard",
    description: "Implement new data visualization for the HR department dashboard",
    status: "in-progress" as const,
    dueDate: "Tomorrow",
    department: "Development",
    priority: "high" as const,
  },
  {
    id: "task2",
    title: "Review quarterly performance metrics",
    description: "Analyze and prepare summary of Q3 performance data for all departments",
    status: "pending" as const,
    dueDate: "Next week",
    department: "HR",
    priority: "medium" as const,
  },
  {
    id: "task3",
    title: "Prepare communication hub documentation",
    description: "Create user guide for the new messaging and notification system",
    status: "completed" as const,
    dueDate: "Yesterday",
    department: "Sales",
    priority: "low" as const,
  },
  {
    id: "task4",
    title: "Task assignment system update",
    description: "Implement new features for task tracking and assignment workflow",
    status: "in-progress" as const,
    dueDate: "3 days",
    department: "Development",
    priority: "medium" as const,
  },
  {
    id: "task5",
    title: "Create marketing campaign proposal",
    description: "Develop a comprehensive marketing strategy for Q4",
    status: "pending" as const,
    dueDate: "Next week",
    department: "Marketing",
    priority: "high" as const,
  },
  {
    id: "task6",
    title: "Update employee onboarding documentation",
    description: "Revise the onboarding materials for new hires",
    status: "completed" as const,
    dueDate: "Last week",
    department: "HR",
    priority: "medium" as const,
  },
  {
    id: "task7",
    title: "Quarterly financial report",
    description: "Prepare and review the Q3 financial statements and analysis",
    status: "in-progress" as const,
    dueDate: "5 days",
    department: "Finance",
    priority: "high" as const,
  },
  {
    id: "task8",
    title: "Implement new authentication system",
    description: "Update the user authentication flow with improved security",
    status: "pending" as const,
    dueDate: "2 weeks",
    department: "Development",
    priority: "high" as const,
  },
];

const taskDistributionData = [
  { name: "Completed", value: 35 },
  { name: "In Progress", value: 45 },
  { name: "Pending", value: 20 },
];

const departmentTasksData = [
  { name: "HR", Completed: 14, "In Progress": 10, Pending: 8 },
  { name: "Sales", Completed: 10, "In Progress": 12, Pending: 6 },
  { name: "Development", Completed: 18, "In Progress": 22, Pending: 8 },
  { name: "Marketing", Completed: 8, "In Progress": 9, Pending: 5 },
  { name: "Finance", Completed: 6, "In Progress": 5, Pending: 4 },
];

const Tasks = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Filter tasks based on search query and active tab
  const filteredTasks = tasksData.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "completed") return matchesSearch && task.status === "completed";
    if (activeTab === "in-progress") return matchesSearch && task.status === "in-progress";
    if (activeTab === "pending") return matchesSearch && task.status === "pending";
    
    return matchesSearch;
  });

  // Calculate task statistics
  const completedTasks = tasksData.filter(task => task.status === "completed").length;
  const inProgressTasks = tasksData.filter(task => task.status === "in-progress").length;
  const pendingTasks = tasksData.filter(task => task.status === "pending").length;

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Task Management</h1>
            <p className="text-muted-foreground mt-1">
              Track, manage, and assign tasks across departments
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus size={16} />
            New Task
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            title="Completed Tasks"
            value={String(completedTasks)}
            icon={CheckSquare}
            trend="up"
            trendValue="15% from last week"
            className="animate-fade-in [animation-delay:100ms]"
          />
          <StatCard
            title="In Progress"
            value={String(inProgressTasks)}
            icon={Clock}
            className="animate-fade-in [animation-delay:200ms]"
          />
          <StatCard
            title="Pending Tasks"
            value={String(pendingTasks)}
            icon={AlertCircle}
            trend="down"
            trendValue="8% from last week"
            className="animate-fade-in [animation-delay:300ms]"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard
            title="Task Distribution"
            type="pie"
            data={taskDistributionData}
            dataKey="value"
            className="animate-fade-in [animation-delay:400ms]"
          />
          <ChartCard
            title="Tasks by Department"
            type="bar"
            data={departmentTasksData}
            dataKey="value"
            categories={["Completed", "In Progress", "Pending"]}
            className="animate-fade-in [animation-delay:500ms]"
          />
        </div>

        <Card className="animate-fade-in [animation-delay:600ms]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Task Management</CardTitle>
                <CardDescription>View, filter, and manage all tasks</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Filter size={16} />
                      Filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuCheckboxItem checked>
                      Show All Departments
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked>
                      Show All Priorities
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <SortAsc size={16} />
                      Sort
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuCheckboxItem checked>
                      Due Date (Closest First)
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>
                      Priority (High to Low)
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>
                      Alphabetical (A-Z)
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="pt-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Tabs defaultValue="all" onValueChange={setActiveTab} className="pt-2">
              <TabsList>
                <TabsTrigger value="all">All Tasks</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="p-0">
            <TasksList tasks={filteredTasks} />
          </CardContent>
          <CardFooter className="flex justify-between py-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredTasks.length} of {tasksData.length} tasks
            </p>
            <div className="flex gap-1">
              <Badge variant="outline">{completedTasks} Completed</Badge>
              <Badge variant="outline">{inProgressTasks} In Progress</Badge>
              <Badge variant="outline">{pendingTasks} Pending</Badge>
            </div>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Tasks;
