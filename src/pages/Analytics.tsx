import React, { useState, useEffect } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { PredictiveChart } from "@/components/dashboard/PredictiveChart";
import { CustomizableDashboard } from "@/components/dashboard/CustomizableDashboard";
import { ResourceOptimizationCard } from "@/components/dashboard/ResourceOptimizationCard";
import { ScheduledReportsCard } from "@/components/dashboard/ScheduledReportsCard";
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
  Printer,
  BrainCircuit,
  LineChart,
  LayoutDashboard,
  Loader2,
  AlertCircle
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
import { Link } from "react-router-dom";
import { usePredictiveAnalytics } from "@/components/PredictiveAnalyticsProvider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCw } from "lucide-react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { setBlockPredictionApiCalls } from "@/lib/analyticsService";

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

// Analytics Error Banner Component
const AnalyticsErrorBanner = () => {
  const { refreshData } = usePredictiveAnalytics();
  // Check if we're in offline mode
  const isOffline = localStorage.getItem('analytics_offline_mode') === 'true';

  return (
    <Alert className={`mb-6 ${isOffline ? 'bg-amber-50 border-amber-200' : 'bg-destructive/15'}`}>
      <div className="flex items-start gap-2">
        <AlertCircle className="h-5 w-5 mt-0.5" />
        <div className="flex-1">
          <AlertTitle className="text-base">
            {isOffline ? 'Using offline mode' : 'Analytics data could not be loaded'}
          </AlertTitle>
          <AlertDescription className="mt-1">
            <p className="text-sm mb-3">
              {isOffline 
                ? 'No connection to analytics server. Using local data instead.'
                : 'Using cached data. Some statistics may not be up-to-date.'}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={refreshData}
            >
              <RefreshCw className="h-4 w-4" />
              {isOffline ? 'Try to connect' : 'Retry'}
            </Button>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

// Replace this wrapper component with a completely static version
interface DummyChartProps {
  metricType: string;
  timeframe: string;
  department: string;
  key?: string;
}

const DummyPredictiveChart = React.memo<DummyChartProps>(({ metricType, timeframe, department }) => {
  // No API calls, just static content
  const dummyData = {
    title: `${metricType} forecast for ${department}`,
    accuracy: 87.5,
    colorHints: {
      historical: "#bb86fc",
      predicted: "#03dac6",
      confidence: "#cf6679"
    },
    data: [
      // Generate fixed historical data points
      ...Array(6).fill(0).map((_, i) => ({
        dataType: "historical",
        formattedDate: `Jan ${i+1}`,
        value: 50 + (i * 5) + (Math.sin(i) * 10)
      })),
      // Generate fixed prediction data points
      ...Array(6).fill(0).map((_, i) => ({
        dataType: "predicted",
        formattedDate: `Feb ${i+1}`,
        value: 80 + (i * 3) + (Math.cos(i) * 5)
      })),
      // Upper and lower bounds
      ...Array(6).fill(0).map((_, i) => ({
        dataType: "upperBound",
        formattedDate: `Feb ${i+1}`,
        value: 85 + (i * 3) + (Math.cos(i) * 5)
      })),
      ...Array(6).fill(0).map((_, i) => ({
        dataType: "lowerBound",
        formattedDate: `Feb ${i+1}`,
        value: 75 + (i * 3) + (Math.cos(i) * 5)
      }))
    ]
  };

  return (
    <Card className="h-full w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-2">
          <CardTitle>{metricType === "WORKLOAD" ? "Workload Prediction" : "Performance Metrics"}</CardTitle>
          <CardDescription>
            {`AI-powered ${timeframe.toLowerCase()} forecast for ${department}`}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="relative h-[500px] w-full p-0 pb-0">
        <div className="flex flex-col h-full pt-6 px-6">
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dummyData.data}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#bb86fc" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#bb86fc" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#03dac6" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#03dac6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fill: 'rgba(255,255,255,0.8)' }}
                  tickLine={{ stroke: 'rgba(255,255,255,0.5)' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.5)' }}
                />
                <YAxis 
                  tick={{ fill: 'rgba(255,255,255,0.8)' }}
                  tickLine={{ stroke: 'rgba(255,255,255,0.5)' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.5)' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(30,30,30,0.9)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white' 
                  }}
                  labelStyle={{ color: 'white' }}
                  itemStyle={{ color: 'white' }}
                />
                <Legend 
                  wrapperStyle={{ color: 'white' }}
                  formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.8)' }}>{value}</span>}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Historical"
                  data={dummyData.data.filter((d) => d.dataType === "historical")}
                  stroke="#bb86fc"
                  strokeWidth={3}
                  fillOpacity={0.5}
                  fill="url(#colorHistorical)"
                  dot={{ 
                    r: 4, 
                    strokeWidth: 2,
                    fill: "#ffffff", 
                    stroke: "#bb86fc" 
                  }}
                  activeDot={{ 
                    r: 6, 
                    strokeWidth: 2, 
                    stroke: "#ffffff" 
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Predicted"
                  data={dummyData.data.filter((d) => d.dataType === "predicted")}
                  stroke="#03dac6"
                  strokeWidth={3}
                  fillOpacity={0.5}
                  fill="url(#colorPredicted)"
                  dot={{ 
                    r: 4, 
                    strokeWidth: 2,
                    fill: "#ffffff", 
                    stroke: "#03dac6" 
                  }}
                  activeDot={{ 
                    r: 6, 
                    strokeWidth: 2, 
                    stroke: "#ffffff" 
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Confidence Interval"
                  data={dummyData.data.filter((d) => d.dataType === "upperBound" || d.dataType === "lowerBound")}
                  stroke="#cf6679"
                  strokeWidth={2}
                  fill="#cf6679"
                  fillOpacity={0.3}
                  activeDot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <span className="text-sm mr-2">Confidence:</span>
              <span className="font-medium">
                {dummyData.accuracy.toFixed(1)}%
              </span>
            </div>
            <Badge variant="secondary">
              {timeframe} Forecast
            </Badge>
            {department && (
              <Badge variant="outline">{department}</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

const Analytics = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState("2023");
  const { departments, getDepartmentPerformanceData } = useDepartments();
  const { tasks, getTasksByDepartment, getTasksByStatus } = useTasks();
  
  const { hasError, refreshData } = usePredictiveAnalytics();
  
  // Save active tab to sessionStorage and handle API blocking
  useEffect(() => {
    sessionStorage.setItem('activeTab', activeTab);
    
    // Block prediction API calls when on the advanced tab
    if (activeTab === 'advanced') {
      console.log('Activating Advanced Analytics tab - blocking API calls');
      setBlockPredictionApiCalls(true);
    } else {
      console.log('Deactivating Advanced Analytics tab - unblocking API calls');
      setBlockPredictionApiCalls(false);
    }
  }, [activeTab]);
  
  // Memoize the prediction chart components to prevent recreation on each render
  const [predictionCharts] = useState(() => ({
    workload: (
      <DummyPredictiveChart
        key="workload-weekly-dev-fixed"
        metricType="WORKLOAD"
        timeframe="WEEKLY"
        department="Development"
      />
    ),
    performance: (
      <DummyPredictiveChart
        key="performance-monthly-dev-fixed"
        metricType="PERFORMANCE"
        timeframe="MONTHLY"
        department="Development"
      />
    )
  }));
  
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

  const handleRetryAnalyticsLoad = () => {
    refreshData();
  };

  // Add a state to manage the prediction modal
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [isGeneratingPrediction, setIsGeneratingPrediction] = useState(false);

  // Update the handleGeneratePrediction function with better error handling and safety mechanisms
  const handleGeneratePrediction = async (metricType: string, timeframe: string) => {
    try {
      setIsGeneratingPrediction(true);
      
      // Set a timeout for the operation to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out")), 5000);
      });
      
      // The actual operation - using a timeout to simulate server response
      const generationPromise = new Promise<void>((resolve) => {
        // Simulate server response
        setTimeout(() => {
          // Log success
          console.log("Generated prediction successfully");
          resolve();
        }, 1500);
      });
      
      // Race between operation and timeout
      await Promise.race([generationPromise, timeoutPromise]);
      
      // If we reach here, the operation succeeded
      toast({
        title: "Prediction generated successfully",
        description: "Your prediction has been generated and is available in the dashboard",
      });
      
      setShowPredictionModal(false);
    } catch (error) {
      console.error("Error generating prediction:", error);
      toast({
        title: "Failed to generate prediction",
        description: "The operation timed out or encountered an error. Try again later.",
        variant: "destructive"
      });
    } finally {
      // Always make sure to reset loading state
      setIsGeneratingPrediction(false);
    }
  };

  // Replace the Create New Prediction modal component with this implementation
  const PredictionModal = () => {
    const [metricType, setMetricType] = useState("PERFORMANCE");
    const [timeframe, setTimeframe] = useState("WEEKLY");
    
    return (
      <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center ${showPredictionModal ? "" : "hidden"}`}>
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="relative">
            <CardTitle>Create New Prediction</CardTitle>
            <CardDescription>
              Generate a new AI-based prediction for the selected metric and timeframe.
            </CardDescription>
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" 
              onClick={() => setShowPredictionModal(false)}
            >
              <AlertCircle className="h-5 w-5" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Metric Type</label>
                <Select 
                  value={metricType} 
                  onValueChange={setMetricType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERFORMANCE">Performance</SelectItem>
                    <SelectItem value="WORKLOAD">Workload</SelectItem>
                    <SelectItem value="EFFICIENCY">Efficiency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Prediction Timeframe</label>
                <Select 
                  value={timeframe} 
                  onValueChange={setTimeframe}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly (Next 7 Days)</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setShowPredictionModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => handleGeneratePrediction(metricType, timeframe)}
              disabled={isGeneratingPrediction}
            >
              {isGeneratingPrediction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Prediction"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
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
          
          <Link to="/advanced-analytics">
            <Button className="flex items-center gap-2">
              <BrainCircuit size={16} />
              Advanced Analytics
            </Button>
          </Link>
          
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

      {hasError && (
        <AnalyticsErrorBanner />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="tasks">Task Tracking</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Analytics</TabsTrigger>
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
        
        <TabsContent value="advanced" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <section>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle>Advanced Analytics</CardTitle>
                    <CardDescription>
                      AI-powered insights and predictive analytics
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => setShowPredictionModal(true)}
                      className="flex items-center"
                    >
                      <BrainCircuit className="mr-2 h-4 w-4" />
                      New Prediction
                    </Button>
                    <Button variant="outline" size="sm" onClick={refreshData}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Data
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            </section>
            
            {/* Static prediction cards to avoid API calls */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Workload Forecast</CardTitle>
                  <CardDescription>
                    Weekly trends and predictions
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[500px]">
                  <div className="flex flex-col h-full pt-6 px-6">
                    <div className="flex-grow">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={[
                            { formattedDate: "Jan 1", dataType: "historical", value: 65 },
                            { formattedDate: "Jan 5", dataType: "historical", value: 68 },
                            { formattedDate: "Jan 10", dataType: "historical", value: 72 },
                            { formattedDate: "Jan 15", dataType: "historical", value: 75 },
                            { formattedDate: "Jan 20", dataType: "historical", value: 78 },
                            { formattedDate: "Jan 25", dataType: "predicted", value: 82 },
                            { formattedDate: "Jan 30", dataType: "predicted", value: 85 },
                            { formattedDate: "Feb 5", dataType: "predicted", value: 88 },
                            { formattedDate: "Feb 10", dataType: "predicted", value: 92 },
                            { formattedDate: "Jan 25", dataType: "upperBound", value: 87 },
                            { formattedDate: "Jan 30", dataType: "upperBound", value: 91 },
                            { formattedDate: "Feb 5", dataType: "upperBound", value: 95 },
                            { formattedDate: "Feb 10", dataType: "upperBound", value: 99 },
                            { formattedDate: "Jan 25", dataType: "lowerBound", value: 77 },
                            { formattedDate: "Jan 30", dataType: "lowerBound", value: 79 },
                            { formattedDate: "Feb 5", dataType: "lowerBound", value: 81 },
                            { formattedDate: "Feb 10", dataType: "lowerBound", value: 85 }
                          ]}
                          margin={{
                            top: 10,
                            right: 30,
                            left: 0,
                            bottom: 0,
                          }}
                        >
                          <defs>
                            <linearGradient id="colorHistorical1" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#bb86fc" stopOpacity={0.9} />
                              <stop offset="95%" stopColor="#bb86fc" stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="colorPredicted1" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#03dac6" stopOpacity={0.9} />
                              <stop offset="95%" stopColor="#03dac6" stopOpacity={0.1} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                          <XAxis
                            dataKey="formattedDate"
                            tick={{ fill: 'rgba(255,255,255,0.8)' }}
                            tickLine={{ stroke: 'rgba(255,255,255,0.5)' }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.5)' }}
                          />
                          <YAxis 
                            tick={{ fill: 'rgba(255,255,255,0.8)' }}
                            tickLine={{ stroke: 'rgba(255,255,255,0.5)' }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.5)' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(30,30,30,0.9)', 
                              border: '1px solid rgba(255,255,255,0.2)',
                              color: 'white' 
                            }}
                            labelStyle={{ color: 'white' }}
                            itemStyle={{ color: 'white' }}
                          />
                          <Legend 
                            wrapperStyle={{ color: 'white' }}
                            formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.8)' }}>{value}</span>}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            name="Historical"
                            data={[
                              { formattedDate: "Jan 1", value: 65 },
                              { formattedDate: "Jan 5", value: 68 },
                              { formattedDate: "Jan 10", value: 72 },
                              { formattedDate: "Jan 15", value: 75 },
                              { formattedDate: "Jan 20", value: 78 }
                            ]}
                            stroke="#bb86fc"
                            strokeWidth={3}
                            fillOpacity={0.5}
                            fill="url(#colorHistorical1)"
                            dot={{ 
                              r: 4, 
                              strokeWidth: 2,
                              fill: "#ffffff", 
                              stroke: "#bb86fc" 
                            }}
                            activeDot={{ 
                              r: 6, 
                              strokeWidth: 2, 
                              stroke: "#ffffff" 
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            name="Predicted"
                            data={[
                              { formattedDate: "Jan 25", value: 82 },
                              { formattedDate: "Jan 30", value: 85 },
                              { formattedDate: "Feb 5", value: 88 },
                              { formattedDate: "Feb 10", value: 92 }
                            ]}
                            stroke="#03dac6"
                            strokeWidth={3}
                            fillOpacity={0.5}
                            fill="url(#colorPredicted1)"
                            dot={{ 
                              r: 4, 
                              strokeWidth: 2,
                              fill: "#ffffff", 
                              stroke: "#03dac6" 
                            }}
                            activeDot={{ 
                              r: 6, 
                              strokeWidth: 2, 
                              stroke: "#ffffff" 
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            name="Confidence Interval"
                            data={[
                              { formattedDate: "Jan 25", value: 87 },
                              { formattedDate: "Jan 30", value: 91 },
                              { formattedDate: "Feb 5", value: 95 },
                              { formattedDate: "Feb 10", value: 99 },
                              { formattedDate: "Jan 25", value: 77 },
                              { formattedDate: "Jan 30", value: 79 },
                              { formattedDate: "Feb 5", value: 81 },
                              { formattedDate: "Feb 10", value: 85 }
                            ].filter(d => d.formattedDate === "Jan 25" || d.formattedDate === "Jan 30" || d.formattedDate === "Feb 5" || d.formattedDate === "Feb 10")}
                            stroke="#cf6679"
                            strokeWidth={2}
                            fill="#cf6679"
                            fillOpacity={0.3}
                            activeDot={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-between items-center py-4">
                      <div className="flex items-center">
                        <span className="text-sm mr-2">Confidence:</span>
                        <span className="font-medium">
                          87.5%
                        </span>
                      </div>
                      <Badge variant="secondary">
                        Weekly Forecast
                      </Badge>
                      <Badge variant="outline">Development</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>
                    Monthly team performance forecast
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[500px]">
                  <div className="flex flex-col h-full pt-6 px-6">
                    <div className="flex-grow">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={[
                            { formattedDate: "Mar 1", dataType: "historical", value: 75 },
                            { formattedDate: "Mar 15", dataType: "historical", value: 78 },
                            { formattedDate: "Apr 1", dataType: "historical", value: 82 },
                            { formattedDate: "Apr 15", dataType: "historical", value: 85 },
                            { formattedDate: "May 1", dataType: "historical", value: 88 },
                            { formattedDate: "May 15", dataType: "predicted", value: 92 },
                            { formattedDate: "Jun 1", dataType: "predicted", value: 95 },
                            { formattedDate: "Jun 15", dataType: "predicted", value: 98 },
                            { formattedDate: "Jul 1", dataType: "predicted", value: 102 },
                            { formattedDate: "May 15", dataType: "upperBound", value: 97 },
                            { formattedDate: "Jun 1", dataType: "upperBound", value: 101 },
                            { formattedDate: "Jun 15", dataType: "upperBound", value: 105 },
                            { formattedDate: "Jul 1", dataType: "upperBound", value: 109 },
                            { formattedDate: "May 15", dataType: "lowerBound", value: 87 },
                            { formattedDate: "Jun 1", dataType: "lowerBound", value: 89 },
                            { formattedDate: "Jun 15", dataType: "lowerBound", value: 91 },
                            { formattedDate: "Jul 1", dataType: "lowerBound", value: 95 }
                          ]}
                          margin={{
                            top: 10,
                            right: 30,
                            left: 0,
                            bottom: 0,
                          }}
                        >
                          <defs>
                            <linearGradient id="colorHistorical2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#bb86fc" stopOpacity={0.9} />
                              <stop offset="95%" stopColor="#bb86fc" stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="colorPredicted2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#03dac6" stopOpacity={0.9} />
                              <stop offset="95%" stopColor="#03dac6" stopOpacity={0.1} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                          <XAxis
                            dataKey="formattedDate"
                            tick={{ fill: 'rgba(255,255,255,0.8)' }}
                            tickLine={{ stroke: 'rgba(255,255,255,0.5)' }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.5)' }}
                          />
                          <YAxis 
                            tick={{ fill: 'rgba(255,255,255,0.8)' }}
                            tickLine={{ stroke: 'rgba(255,255,255,0.5)' }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.5)' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(30,30,30,0.9)', 
                              border: '1px solid rgba(255,255,255,0.2)',
                              color: 'white' 
                            }}
                            labelStyle={{ color: 'white' }}
                            itemStyle={{ color: 'white' }}
                          />
                          <Legend 
                            wrapperStyle={{ color: 'white' }}
                            formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.8)' }}>{value}</span>}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            name="Historical"
                            data={[
                              { formattedDate: "Mar 1", value: 75 },
                              { formattedDate: "Mar 15", value: 78 },
                              { formattedDate: "Apr 1", value: 82 },
                              { formattedDate: "Apr 15", value: 85 },
                              { formattedDate: "May 1", value: 88 }
                            ]}
                            stroke="#bb86fc"
                            strokeWidth={3}
                            fillOpacity={0.5}
                            fill="url(#colorHistorical2)"
                            dot={{ 
                              r: 4, 
                              strokeWidth: 2,
                              fill: "#ffffff", 
                              stroke: "#bb86fc" 
                            }}
                            activeDot={{ 
                              r: 6, 
                              strokeWidth: 2, 
                              stroke: "#ffffff" 
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            name="Predicted"
                            data={[
                              { formattedDate: "May 15", value: 92 },
                              { formattedDate: "Jun 1", value: 95 },
                              { formattedDate: "Jun 15", value: 98 },
                              { formattedDate: "Jul 1", value: 102 }
                            ]}
                            stroke="#03dac6"
                            strokeWidth={3}
                            fillOpacity={0.5}
                            fill="url(#colorPredicted2)"
                            dot={{ 
                              r: 4, 
                              strokeWidth: 2,
                              fill: "#ffffff", 
                              stroke: "#03dac6" 
                            }}
                            activeDot={{ 
                              r: 6, 
                              strokeWidth: 2, 
                              stroke: "#ffffff" 
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            name="Confidence Interval"
                            data={[
                              { formattedDate: "May 15", value: 97 },
                              { formattedDate: "Jun 1", value: 101 },
                              { formattedDate: "Jun 15", value: 105 },
                              { formattedDate: "Jul 1", value: 109 },
                              { formattedDate: "May 15", value: 87 },
                              { formattedDate: "Jun 1", value: 89 },
                              { formattedDate: "Jun 15", value: 91 },
                              { formattedDate: "Jul 1", value: 95 }
                            ].filter(d => d.formattedDate === "May 15" || d.formattedDate === "Jun 1" || d.formattedDate === "Jun 15" || d.formattedDate === "Jul 1")}
                            stroke="#cf6679"
                            strokeWidth={2}
                            fill="#cf6679"
                            fillOpacity={0.3}
                            activeDot={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-between items-center py-4">
                      <div className="flex items-center">
                        <span className="text-sm mr-2">Confidence:</span>
                        <span className="font-medium">
                          92.3%
                        </span>
                      </div>
                      <Badge variant="secondary">
                        Monthly Forecast
                      </Badge>
                      <Badge variant="outline">All Departments</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Render the modal component outside the tabs */}
      {PredictionModal()}
    </div>
  );
};

export default Analytics;
