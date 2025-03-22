import React, { useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { TasksList } from "@/components/dashboard/TasksList";
import { useTasks } from "@/components/TasksProvider";
import { AddTaskDialog } from "@/components/dashboard/AddTaskDialog";
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
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

const Tasks = () => {
  const { tasks, getTasksByStatus } = useTasks();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [filterByDepartment, setFilterByDepartment] = useState<string[]>([]);
  const [filterByPriority, setFilterByPriority] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("dueDate");

  // Get unique departments from tasks
  const departments = Array.from(
    new Set(tasks.map((task) => task.department))
  );

  // Check if department filter is active
  const isDepartmentFilterActive = filterByDepartment.length > 0;
  
  // Check if priority filter is active
  const isPriorityFilterActive = filterByPriority.length > 0;

  // Get filtered tasks based on search, tabs, and filters
  const filteredTasks = tasks.filter(task => {
    // Search filter
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Tab filter
    const matchesTab = 
      activeTab === "all" ||
      (activeTab === "completed" && task.status === "completed") ||
      (activeTab === "in-progress" && task.status === "in-progress") ||
      (activeTab === "pending" && task.status === "pending");
    
    // Department filter
    const matchesDepartment = !isDepartmentFilterActive || filterByDepartment.includes(task.department);
    
    // Priority filter
    const matchesPriority = !isPriorityFilterActive || filterByPriority.includes(task.priority);
    
    return matchesSearch && matchesTab && matchesDepartment && matchesPriority;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "dueDate") {
      // Simple sorting based on string comparison for this demo
      return a.dueDate.localeCompare(b.dueDate);
    } else if (sortBy === "priority") {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    } else if (sortBy === "alphabetical") {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  // Task statistics
  const completedTasks = getTasksByStatus("completed").length;
  const inProgressTasks = getTasksByStatus("in-progress").length;
  const pendingTasks = getTasksByStatus("pending").length;

  // Task distribution data for chart
  const taskDistributionData = [
    { name: "Completed", value: completedTasks },
    { name: "In Progress", value: inProgressTasks },
    { name: "Pending", value: pendingTasks },
  ];

  // Department tasks data for chart
  const departmentTasksData = departments.map(department => {
    const deptTasks = tasks.filter(task => task.department === department);
    const completed = deptTasks.filter(task => task.status === "completed").length;
    const inProgress = deptTasks.filter(task => task.status === "in-progress").length;
    const pending = deptTasks.filter(task => task.status === "pending").length;
    
    return {
      name: department,
      Completed: completed,
      "In Progress": inProgress,
      Pending: pending
    };
  });

  // Toggle department filter
  const toggleDepartmentFilter = (department: string) => {
    setFilterByDepartment(prev => 
      prev.includes(department)
        ? prev.filter(dep => dep !== department)
        : [...prev, department]
    );
  };

  // Toggle priority filter
  const togglePriorityFilter = (priority: string) => {
    setFilterByPriority(prev => 
      prev.includes(priority)
        ? prev.filter(pri => pri !== priority)
        : [...prev, priority]
    );
  };

  // Reset all filters
  const resetAllFilters = () => {
    setFilterByDepartment([]);
    setFilterByPriority([]);
    setSearchQuery("");
    setActiveTab("all");
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Management</h1>
          <p className="text-muted-foreground mt-1">
            Track, manage, and assign tasks across departments
          </p>
        </div>
        <AddTaskDialog />
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
                <DropdownMenuContent align="end" className="w-56">
                  <div className="p-2">
                    <div className="font-medium mb-1">Departments</div>
                    {departments.map((department) => (
                      <DropdownMenuCheckboxItem
                        key={department}
                        checked={filterByDepartment.includes(department)}
                        onCheckedChange={() => toggleDepartmentFilter(department)}
                      >
                        {department}
                      </DropdownMenuCheckboxItem>
                    ))}
                    <div className="font-medium mb-1 mt-4">Priority</div>
                    <DropdownMenuCheckboxItem
                      checked={filterByPriority.includes("high")}
                      onCheckedChange={() => togglePriorityFilter("high")}
                    >
                      High
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={filterByPriority.includes("medium")}
                      onCheckedChange={() => togglePriorityFilter("medium")}
                    >
                      Medium
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={filterByPriority.includes("low")}
                      onCheckedChange={() => togglePriorityFilter("low")}
                    >
                      Low
                    </DropdownMenuCheckboxItem>
                    <div className="border-t my-2"></div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full" 
                      onClick={resetAllFilters}
                    >
                      Reset Filters
                    </Button>
                  </div>
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
                  <DropdownMenuCheckboxItem
                    checked={sortBy === "dueDate"}
                    onCheckedChange={() => setSortBy("dueDate")}
                  >
                    Due Date (Closest First)
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={sortBy === "priority"}
                    onCheckedChange={() => setSortBy("priority")}
                  >
                    Priority (High to Low)
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={sortBy === "alphabetical"}
                    onCheckedChange={() => setSortBy("alphabetical")}
                  >
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
          <TasksList tasks={sortedTasks} />
        </CardContent>
        <CardFooter className="flex justify-between py-4">
          <p className="text-sm text-muted-foreground">
            Showing {sortedTasks.length} of {tasks.length} tasks
          </p>
          <div className="flex gap-1">
            <Badge variant="outline">{completedTasks} Completed</Badge>
            <Badge variant="outline">{inProgressTasks} In Progress</Badge>
            <Badge variant="outline">{pendingTasks} Pending</Badge>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Tasks;
