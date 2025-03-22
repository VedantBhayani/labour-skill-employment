import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Filter, Calendar, BarChart3, PieChart, Users, RefreshCw, Printer, Share2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useDepartments } from "@/components/DepartmentsProvider";
import { useTasks } from "@/components/TasksProvider";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { ChartCard } from "@/components/dashboard/ChartCard";

// Report structure
interface Report {
  id: string;
  title: string;
  description: string;
  date: string;
  type: "PDF" | "Excel" | "PowerPoint" | "CSV";
  category: "performance" | "financial" | "hr" | "project" | "custom";
  department?: string;
  generated: boolean;
}

const Reports = () => {
  const [activeTab, setActiveTab] = useState("available");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState("quarter");
  const { departments, getDepartmentPerformanceData } = useDepartments();
  const { tasks } = useTasks();
  
  // Current date for report generation
  const currentDate = format(new Date(), "MMMM dd, yyyy");
  
  // Pre-defined reports
  const availableReports: Report[] = [
    { 
      id: "report1",
      title: "Q3 Department Performance", 
      description: "Overall metrics and KPIs for all departments", 
      date: "September 30, 2023",
      type: "PDF",
      category: "performance",
      generated: true
    },
    { 
      id: "report2",
      title: "Annual Revenue Projection", 
      description: "Financial forecasting and revenue trends", 
      date: "December 15, 2023",
      type: "Excel",
      category: "financial",
      generated: true
    },
    { 
      id: "report3",
      title: "Employee Satisfaction Survey", 
      description: "Results from the quarterly employee feedback survey", 
      date: "August 22, 2023",
      type: "PDF",
      category: "hr",
      generated: true
    },
    { 
      id: "report4",
      title: "Project Completion Analysis", 
      description: "Analytics on project timelines and resource allocation", 
      date: "October 10, 2023",
      type: "PDF",
      category: "project",
      generated: true
    },
    { 
      id: "report5",
      title: "Marketing Campaign Results", 
      description: "Performance metrics for Q3 marketing initiatives", 
      date: "September 15, 2023",
      type: "PowerPoint",
      category: "performance",
      department: "Marketing",
      generated: true
    },
    { 
      id: "report6",
      title: "Department Budget Overview", 
      description: "Budget allocation and expenses by department", 
      date: "July 30, 2023",
      type: "Excel",
      category: "financial",
      generated: true
    },
  ];
  
  // Dynamic reports that can be generated
  const dynamicReports: Report[] = [
    { 
      id: "dynamic1",
      title: "Current Department Performance", 
      description: "Real-time metrics and KPIs for all departments", 
      date: currentDate,
      type: "PDF",
      category: "performance",
      generated: false
    },
    { 
      id: "dynamic2",
      title: "Task Completion Analysis", 
      description: "Current task statuses and completion rates across departments", 
      date: currentDate,
      type: "Excel",
      category: "project",
      generated: false
    },
    { 
      id: "dynamic3",
      title: "Department Resource Utilization", 
      description: "Analysis of resource allocation and efficiency", 
      date: currentDate,
      type: "PDF",
      category: "performance",
      generated: false
    },
    { 
      id: "dynamic4",
      title: "Budget vs. Actual Expenditure", 
      description: "Comparison of planned budget against actual spending", 
      date: currentDate,
      type: "Excel",
      category: "financial",
      generated: false
    },
  ];
  
  // Sample data for departmental performance
  const departmentPerformanceData = [
    { name: "Jan", HR: 65, Sales: 78, Development: 82, Marketing: 58, Finance: 71 },
    { name: "Feb", HR: 59, Sales: 85, Development: 77, Marketing: 62, Finance: 68 },
    { name: "Mar", HR: 80, Sales: 88, Development: 90, Marketing: 70, Finance: 82 },
    { name: "Apr", HR: 81, Sales: 70, Development: 93, Marketing: 65, Finance: 78 },
    { name: "May", HR: 76, Sales: 67, Development: 85, Marketing: 80, Finance: 74 },
    { name: "Jun", HR: 84, Sales: 80, Development: 89, Marketing: 71, Finance: 86 },
  ];
  
  // Function to handle report download
  const handleDownloadReport = (report: Report) => {
    toast({
      title: "Report Downloaded",
      description: `${report.title} has been downloaded as ${report.type}`,
    });
  };
  
  // Function to handle report generation
  const handleGenerateReport = (report: Report) => {
    toast({
      title: "Report Generated",
      description: `${report.title} has been generated and is ready for download`,
    });
  };
  
  // Function to handle report sharing
  const handleShareReport = (report: Report) => {
    toast({
      title: "Report Shared",
      description: "A shareable link has been copied to your clipboard",
    });
  };
  
  // Function to handle report printing
  const handlePrintReport = (report: Report) => {
    toast({
      title: "Printing Report",
      description: `${report.title} is being sent to the printer`,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Access, generate, and download reports for data-driven decision making
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quarter">Current Quarter</SelectItem>
              <SelectItem value="year">Full Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button className="flex items-center gap-2">
            <Download size={16} />
            Export All
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
          <TabsTrigger value="available">Available Reports</TabsTrigger>
          <TabsTrigger value="generate">Generate Reports</TabsTrigger>
          <TabsTrigger value="insights">Data Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="available" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableReports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-all">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <FileText className="text-muted-foreground" size={18} />
                  </div>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">Generated: {report.date}</p>
                      <Badge variant="outline">{report.type}</Badge>
                    </div>
                    {report.department && (
                      <p className="text-sm">Department: {report.department}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => handlePrintReport(report)}>
                    <Printer size={14} />
                    Print
                  </Button>
                  <Button variant="default" size="sm" className="flex items-center gap-2" onClick={() => handleDownloadReport(report)}>
                    <Download size={14} />
                    Download
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Custom Reports</CardTitle>
              <CardDescription>Create new reports based on real-time data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="report-type" className="text-sm font-medium">Report Type</label>
                    <Select defaultValue="performance">
                      <SelectTrigger id="report-type">
                        <SelectValue placeholder="Report Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="financial">Financial</SelectItem>
                        <SelectItem value="hr">HR & Personnel</SelectItem>
                        <SelectItem value="project">Project & Tasks</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="department-filter" className="text-sm font-medium">Department</label>
                    <Select defaultValue="all">
                      <SelectTrigger id="department-filter">
                        <SelectValue placeholder="Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="output-format" className="text-sm font-medium">Output Format</label>
                    <Select defaultValue="pdf">
                      <SelectTrigger id="output-format">
                        <SelectValue placeholder="Output Format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF Document</SelectItem>
                        <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                        <SelectItem value="csv">CSV File</SelectItem>
                        <SelectItem value="ppt">PowerPoint</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="report-name" className="text-sm font-medium">Report Name</label>
                  <Input id="report-name" placeholder="Enter a name for your report" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Include Data Sections</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="perf-metrics" className="rounded" defaultChecked />
                      <label htmlFor="perf-metrics">Performance Metrics</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="task-completion" className="rounded" defaultChecked />
                      <label htmlFor="task-completion">Task Completion</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="resource-util" className="rounded" defaultChecked />
                      <label htmlFor="resource-util">Resource Utilization</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="trend-analysis" className="rounded" defaultChecked />
                      <label htmlFor="trend-analysis">Trend Analysis</label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Generate Custom Report</Button>
            </CardFooter>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dynamicReports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-all">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <Badge variant="outline">Real-time</Badge>
                  </div>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Date: {report.date}</p>
                      <p className="text-sm font-medium">{report.type} Report</p>
                    </div>
                    <Button variant="outline" size="icon">
                      <RefreshCw size={16} />
                    </Button>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => handleGenerateReport(report)}
                  >
                    <FileText size={16} />
                    Generate Report
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
                <CardDescription>Trend analysis of performance metrics by department</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ChartCard
                  title=""
                  type="line"
                  data={departmentPerformanceData}
                  dataKey="value"
                  categories={["HR", "Sales", "Development", "Marketing", "Finance"]}
                  className="h-[300px]"
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Badge variant="outline" className="px-3">Performance Insights</Badge>
                <Button variant="outline" size="sm">View Detailed Analysis</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Task Completion Analysis</CardTitle>
                <CardDescription>Task status distribution and completion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>In Progress</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Completion Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map(dept => {
                      const deptTasks = tasks.filter(task => task.department === dept.name);
                      const completed = deptTasks.filter(task => task.status === "completed").length;
                      const inProgress = deptTasks.filter(task => task.status === "in-progress").length;
                      const pending = deptTasks.filter(task => task.status === "pending").length;
                      const completionRate = deptTasks.length > 0 
                        ? Math.round((completed / deptTasks.length) * 100) 
                        : 0;
                        
                      return (
                        <TableRow key={dept.id}>
                          <TableCell className="font-medium">{dept.name}</TableCell>
                          <TableCell>{completed}</TableCell>
                          <TableCell>{inProgress}</TableCell>
                          <TableCell>{pending}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <progress 
                                value={completionRate} 
                                max="100"
                                className="h-2 w-16"
                              />
                              <span>{completionRate}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Badge variant="outline" className="px-3">Workflow Insights</Badge>
                <Button variant="outline" size="sm">Export Analysis</Button>
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Decision Support Recommendations</CardTitle>
              <CardDescription>AI-driven insights to improve department performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    title: "Resource Allocation Optimization",
                    description: "Based on current utilization patterns, redistributing resources from Marketing to Development could improve overall productivity by an estimated 12%.",
                    impact: "high"
                  },
                  {
                    title: "Task Prioritization Strategy",
                    description: "The Sales department has an accumulation of high-priority tasks. Consider temporarily reassigning team members to clear the backlog.",
                    impact: "medium"
                  },
                  {
                    title: "Performance Trend Alert",
                    description: "HR department shows declining performance metrics over the past 3 months. Schedule a department review to identify root causes.",
                    impact: "high"
                  },
                ].map((insight, index) => (
                  <div key={index} className="border rounded-md p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">{insight.title}</h3>
                      <Badge variant={
                        insight.impact === "high" ? "destructive" : 
                        insight.impact === "medium" ? "default" : 
                        "outline"
                      }>
                        {insight.impact.charAt(0).toUpperCase() + insight.impact.slice(1)} Impact
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm">Apply Recommendation</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Generate Full Recommendations Report</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
