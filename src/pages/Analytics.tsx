import React, { useState, useEffect } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  FileText,
  Building,
  Download,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  Filter,
  Share2,
  Printer
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useDepartments } from "@/components/DepartmentsProvider";
import { useTasks } from "@/components/TasksProvider";
import { format, isAfter, isBefore, addDays } from "date-fns";

// Helper function to format date
const formatDate = (dateString: string) => {
  try {
    // Handle relative dates
    if (dateString === "Tomorrow") {
      return format(addDays(new Date(), 1), "MMM dd, yyyy");
    } else if (dateString === "Yesterday") {
      return format(addDays(new Date(), -1), "MMM dd, yyyy");
    } else if (dateString === "Next week") {
      return format(addDays(new Date(), 7), "MMM dd, yyyy");
    } else if (dateString === "Last week") {
      return format(addDays(new Date(), -7), "MMM dd, yyyy");
    } else if (dateString.includes("days")) {
      const days = parseInt(dateString);
      return format(addDays(new Date(), days), "MMM dd, yyyy");
    }
    return dateString;
  } catch (e) {
    return dateString;
  }
};

// Helper function to check if a task is overdue
const isTaskOverdue = (dueDate: string, status: string) => {
  if (status === "completed") return false;
  
  try {
    // Handle relative dates
    let deadline = new Date();
    if (dueDate === "Tomorrow") {
      deadline = addDays(new Date(), 1);
    } else if (dueDate === "Yesterday") {
      deadline = addDays(new Date(), -1);
    } else if (dueDate === "Next week") {
      deadline = addDays(new Date(), 7);
    } else if (dueDate === "Last week") {
      deadline = addDays(new Date(), -7);
    } else if (dueDate.includes("days")) {
      const days = parseInt(dueDate);
      deadline = addDays(new Date(), days);
    } else {
      return false; // If we can't parse, assume not overdue
    }
    
    return isBefore(deadline, new Date());
  } catch (e) {
    return false;
  }
};

const Analytics = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState("2023");
  const { departments, getDepartmentPerformanceData } = useDepartments();
  const { tasks, getTasksByDepartment, getTasksByStatus } = useTasks();
  
  // Calculate task metrics
  const completedTasks = getTasksByStatus("completed").length;
  const inProgressTasks = getTasksByStatus("in-progress").length;
  const pendingTasks = getTasksByStatus("pending").length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Identify overdue tasks
  const overdueTasks = tasks.filter(task => isTaskOverdue(task.dueDate, task.status));
  
  // Get department performance data for charts
  const departmentPerformanceData = getDepartmentPerformanceData();
  
  // Department KPIs with dynamic data
  const departmentKPIs = departments.map(dept => {
    const deptTasks = getTasksByDepartment(dept.name);
    const deptCompletedTasks = deptTasks.filter(task => task.status === "completed").length;
    const deptCompletionRate = deptTasks.length > 0 ? Math.round((deptCompletedTasks / deptTasks.length) * 100) : 0;
    
    return {
      department: dept.name,
      metrics: [
        { 
          name: "Task Completion", 
          value: deptCompletionRate, 
          target: 85, 
          unit: "%" 
        },
        { 
          name: "Resource Utilization", 
          value: dept.progress, 
          target: 80, 
          unit: "%" 
        },
        { 
          name: "Project Progress", 
          value: Math.min(Math.round((dept.tasks / (dept.tasks + 5)) * 100), 100), 
          target: 90, 
          unit: "%" 
        },
      ]
    };
  });
  
  // Convert raw data for pie chart
  const resourceUtilizationData = departments.map(dept => ({
    name: dept.name,
    value: dept.progress
  }));
  
  // Generate task data by status for charts
  const taskStatusData = [
    { name: "Completed", value: completedTasks },
    { name: "In Progress", value: inProgressTasks },
    { name: "Pending", value: pendingTasks },
  ];
  
  // Generate monthly task completion data
  const taskCompletionData = [
    { name: "Jan", Tasks: 45, Target: 50 },
    { name: "Feb", Tasks: 52, Target: 50 },
    { name: "Mar", Tasks: 49, Target: 50 },
    { name: "Apr", Tasks: 62, Target: 60 },
    { name: "May", Tasks: 55, Target: 60 },
    { name: "Jun", Tasks: 58, Target: 60 },
    { name: "Jul", Tasks: 68, Target: 65 },
    { name: "Aug", Tasks: 63, Target: 65 },
    { name: "Sep", Tasks: 67, Target: 65 },
    { name: "Oct", Tasks: 72, Target: 70 },
    { name: "Nov", Tasks: 68, Target: 70 },
    { name: "Dec", Tasks: 75, Target: 70 },
  ];
  
  const handleExportReport = (format: string) => {
    toast({
      title: `Report exported as ${format.toUpperCase()}`,
      description: "Your report has been generated and downloaded successfully",
    });
  };
  
  const handlePrintReport = () => {
    toast({
      title: "Preparing to print",
      description: "Your report is being prepared for printing",
    });
    window.print();
  };
  
  const handleShareReport = () => {
    toast({
      title: "Report link generated",
      description: "A shareable link has been copied to your clipboard",
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Department performance metrics and organizational insights
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
              <SelectItem value="2021">2021</SelectItem>
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Download size={16} />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Export Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExportReport('pdf')}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Export as PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportReport('excel')}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Export as Excel</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportReport('csv')}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Export as CSV</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handlePrintReport}>
                <Printer className="mr-2 h-4 w-4" />
                <span>Print Report</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShareReport}>
                <Share2 className="mr-2 h-4 w-4" />
                <span>Share Report</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="tasks">Task Tracking</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Performance Index"
              value="87.5"
              icon={BarChart3}
              trend="up"
              trendValue="4.2% from last month"
              className="animate-fade-in [animation-delay:100ms]"
            />
            <StatCard
              title="Completion Rate"
              value={`${completionRate}%`}
              icon={CheckCircle}
              trend={completionRate > 75 ? "up" : "down"}
              trendValue={`${completionRate > 75 ? "Above" : "Below"} target`}
              className="animate-fade-in [animation-delay:200ms]"
            />
            <StatCard
              title="Resource Efficiency"
              value="92%"
              icon={Users}
              trend="up"
              trendValue="5% from target"
              className="animate-fade-in [animation-delay:300ms]"
            />
            <StatCard
              title="Overdue Tasks"
              value={`${overdueTasks.length}`}
              icon={AlertTriangle}
              trend={overdueTasks.length > 5 ? "down" : "up"}
              trendValue={overdueTasks.length > 5 ? "Requires attention" : "On track"}
              className="animate-fade-in [animation-delay:400ms]"
            />
          </div>

          <Card className="animate-fade-in [animation-delay:500ms]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>Annual Department Performance</CardTitle>
                <CardDescription>
                  Track performance indices across all departments throughout the year
                </CardDescription>
              </div>
              <Select defaultValue="all" onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <ChartCard
                title=""
                type="line"
                data={departmentPerformanceData}
                dataKey="value"
                categories={selectedDepartment === "all" 
                  ? ["HR", "Sales", "Development", "Marketing", "Finance"] 
                  : [selectedDepartment]}
                className="h-[350px]"
              />
            </CardContent>
            <CardFooter>
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary"></div>
                  <span>HR</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span>Sales</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span>Development</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <span>Marketing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <span>Finance</span>
                </div>
              </div>
            </CardFooter>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="animate-fade-in [animation-delay:600ms]">
              <CardHeader>
                <CardTitle>Task Completion vs Target</CardTitle>
                <CardDescription>
                  Monthly task completion rates compared to targets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartCard
                  title=""
                  type="bar"
                  data={taskCompletionData}
                  dataKey="value"
                  categories={["Tasks", "Target"]}
                  className="h-[300px]"
                />
              </CardContent>
            </Card>
            <Card className="animate-fade-in [animation-delay:700ms]">
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
                <CardDescription>
                  Current task distribution by status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartCard
                  title=""
                  type="pie"
                  data={taskStatusData}
                  dataKey="value"
                  className="h-[300px]"
                />
              </CardContent>
              <CardFooter>
                <div className="w-full flex justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span>Completed ({completedTasks})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                    <span>In Progress ({inProgressTasks})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                    <span>Pending ({pendingTasks})</span>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="departments" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Departments"
              value={departments.length.toString()}
              icon={Building}
              className="animate-fade-in [animation-delay:100ms]"
            />
            <StatCard
              title="Total Employees"
              value={departments.reduce((acc, dept) => acc + dept.employees, 0).toString()}
              icon={Users}
              className="animate-fade-in [animation-delay:200ms]"
            />
            <StatCard
              title="Active Projects"
              value={departments.reduce((acc, dept) => acc + dept.projects, 0).toString()}
              icon={FileText}
              className="animate-fade-in [animation-delay:300ms]"
            />
            <StatCard
              title="Avg Department Performance"
              value={`${Math.round(departments.reduce((acc, dept) => acc + dept.progress, 0) / departments.length)}%`}
              icon={TrendingUp}
              className="animate-fade-in [animation-delay:400ms]"
            />
          </div>
          
          <Card className="animate-fade-in [animation-delay:500ms]">
            <CardHeader>
              <CardTitle>Department Performance Metrics</CardTitle>
              <CardDescription>
                Key performance indicators for each department
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>KPI Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell>{dept.employees}</TableCell>
                      <TableCell>{dept.projects}</TableCell>
                      <TableCell>{dept.tasks}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={dept.progress} className="w-[60px]" />
                          <span>{dept.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={dept.progress >= 75 ? "default" : dept.progress >= 60 ? "secondary" : "destructive"}>
                          {dept.progress >= 75 ? "On Track" : dept.progress >= 60 ? "Needs Attention" : "At Risk"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="animate-fade-in [animation-delay:600ms]">
              <CardHeader>
                <CardTitle>Department Resource Utilization</CardTitle>
                <CardDescription>
                  Resource efficiency metrics across departments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartCard
                  title=""
                  type="pie"
                  data={resourceUtilizationData}
                  dataKey="value"
                  className="h-[300px]"
                />
              </CardContent>
            </Card>
            <Card className="animate-fade-in [animation-delay:700ms]">
              <CardHeader>
                <CardTitle>Department KPI Breakdown</CardTitle>
                <CardDescription>
                  Detailed breakdown of department-specific KPIs
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[300px] overflow-y-auto space-y-6">
                {departmentKPIs.map((deptKPI) => (
                  <div key={deptKPI.department} className="space-y-2">
                    <h3 className="font-medium">{deptKPI.department}</h3>
                    <div className="space-y-4">
                      {deptKPI.metrics.map((metric) => (
                        <div key={metric.name} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{metric.name}</span>
                            <span>
                              {metric.value}{metric.unit} / Target: {metric.target}{metric.unit}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={metric.value} 
                              className={`h-2 ${metric.value >= metric.target ? "bg-green-500" : "bg-yellow-500"}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tasks" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Tasks"
              value={totalTasks.toString()}
              icon={FileText}
              className="animate-fade-in [animation-delay:100ms]"
            />
            <StatCard
              title="Completed Tasks"
              value={completedTasks.toString()}
              icon={CheckCircle}
              trend="up"
              trendValue={`${completionRate}% completion rate`}
              className="animate-fade-in [animation-delay:200ms]"
            />
            <StatCard
              title="In Progress"
              value={inProgressTasks.toString()}
              icon={Clock}
              className="animate-fade-in [animation-delay:300ms]"
            />
            <StatCard
              title="Overdue Tasks"
              value={overdueTasks.length.toString()}
              icon={AlertTriangle}
              trend={overdueTasks.length > 5 ? "down" : "up"}
              trendValue={overdueTasks.length > 0 ? "Needs attention" : "On track"}
              className="animate-fade-in [animation-delay:400ms]"
            />
          </div>
          
          <Card className="animate-fade-in [animation-delay:500ms]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>Task Deadlines & Tracking</CardTitle>
                <CardDescription>
                  Monitor task progress and upcoming deadlines
                </CardDescription>
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>{task.department}</TableCell>
                      <TableCell className={isTaskOverdue(task.dueDate, task.status) ? "text-red-500 font-semibold" : ""}>
                        {formatDate(task.dueDate)}
                        {isTaskOverdue(task.dueDate, task.status) && " (Overdue)"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          task.priority === "high" ? "destructive" : 
                          task.priority === "medium" ? "secondary" : 
                          "outline"
                        }>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          task.status === "completed" ? "default" : 
                          task.status === "in-progress" ? "secondary" : 
                          "outline"
                        }>
                          {task.status === "completed" ? "Completed" : 
                           task.status === "in-progress" ? "In Progress" : 
                           "Pending"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {tasks.length} tasks
              </div>
              <Button variant="outline" size="sm">
                View All Tasks
              </Button>
            </CardFooter>
          </Card>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="animate-fade-in [animation-delay:600ms]">
              <CardHeader>
                <CardTitle>Task Completion Timeline</CardTitle>
                <CardDescription>
                  Monthly task completion trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartCard
                  title=""
                  type="line"
                  data={taskCompletionData}
                  dataKey="value"
                  categories={["Tasks", "Target"]}
                  className="h-[300px]"
                />
              </CardContent>
            </Card>
            <Card className="animate-fade-in [animation-delay:700ms]">
              <CardHeader>
                <CardTitle>Department Task Distribution</CardTitle>
                <CardDescription>
                  Task distribution across departments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead>Total Tasks</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Completion Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((dept) => {
                      const deptTasks = getTasksByDepartment(dept.name);
                      const deptCompletedTasks = deptTasks.filter(task => task.status === "completed").length;
                      const deptCompletionRate = deptTasks.length > 0 ? Math.round((deptCompletedTasks / deptTasks.length) * 100) : 0;
                      
                      return (
                        <TableRow key={dept.id}>
                          <TableCell className="font-medium">{dept.name}</TableCell>
                          <TableCell>{deptTasks.length}</TableCell>
                          <TableCell>{deptCompletedTasks}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={deptCompletionRate} className="w-[60px]" />
                              <span>{deptCompletionRate}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
