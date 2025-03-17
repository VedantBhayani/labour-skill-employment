
import React from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  FileText,
  Building,
  Download
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

const performanceData = [
  { name: "Jan", HR: 65, Sales: 78, Development: 82, Marketing: 71, Finance: 68 },
  { name: "Feb", HR: 59, Sales: 85, Development: 77, Marketing: 80, Finance: 74 },
  { name: "Mar", HR: 80, Sales: 88, Development: 90, Marketing: 79, Finance: 82 },
  { name: "Apr", HR: 81, Sales: 70, Development: 93, Marketing: 65, Finance: 78 },
  { name: "May", HR: 76, Sales: 67, Development: 85, Marketing: 72, Finance: 74 },
  { name: "Jun", HR: 84, Sales: 80, Development: 89, Marketing: 85, Finance: 86 },
  { name: "Jul", HR: 92, Sales: 86, Development: 91, Marketing: 83, Finance: 89 },
  { name: "Aug", HR: 88, Sales: 92, Development: 86, Marketing: 81, Finance: 85 },
  { name: "Sep", HR: 79, Sales: 95, Development: 88, Marketing: 87, Finance: 91 },
  { name: "Oct", HR: 83, Sales: 89, Development: 94, Marketing: 84, Finance: 87 },
  { name: "Nov", HR: 90, Sales: 84, Development: 90, Marketing: 88, Finance: 83 },
  { name: "Dec", HR: 94, Sales: 91, Development: 89, Marketing: 90, Finance: 92 },
];

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

const resourceUtilizationData = [
  { name: "HR", value: 78 },
  { name: "Sales", value: 85 },
  { name: "Development", value: 92 },
  { name: "Marketing", value: 70 },
  { name: "Finance", value: 65 },
];

const departmentKPIs = [
  { 
    department: "HR", 
    metrics: [
      { name: "Hiring Rate", value: 89, target: 85, unit: "%" },
      { name: "Employee Retention", value: 92, target: 90, unit: "%" },
      { name: "Training Completion", value: 78, target: 80, unit: "%" }
    ] 
  },
  { 
    department: "Sales", 
    metrics: [
      { name: "Revenue Target", value: 92, target: 90, unit: "%" },
      { name: "Customer Acquisition", value: 85, target: 80, unit: "%" },
      { name: "Deal Closure Rate", value: 72, target: 75, unit: "%" }
    ] 
  },
  { 
    department: "Development", 
    metrics: [
      { name: "Sprint Completion", value: 95, target: 90, unit: "%" },
      { name: "Bug Resolution", value: 87, target: 85, unit: "%" },
      { name: "Code Quality", value: 90, target: 90, unit: "%" }
    ] 
  },
  { 
    department: "Marketing", 
    metrics: [
      { name: "Campaign Performance", value: 88, target: 85, unit: "%" },
      { name: "Lead Generation", value: 76, target: 80, unit: "%" },
      { name: "Brand Engagement", value: 82, target: 80, unit: "%" }
    ] 
  },
  { 
    department: "Finance", 
    metrics: [
      { name: "Budget Adherence", value: 97, target: 95, unit: "%" },
      { name: "Cost Reduction", value: 83, target: 80, unit: "%" },
      { name: "Financial Reporting", value: 100, target: 100, unit: "%" }
    ] 
  }
];

const Analytics = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Performance metrics and organizational insights
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue="2023">
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
                <SelectItem value="2021">2021</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center gap-2">
              <Download size={16} />
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <StatCard
            title="Performance Index"
            value="87.5"
            icon={BarChart3}
            trend="up"
            trendValue="4.2% from last month"
            className="animate-fade-in [animation-delay:100ms]"
          />
          <StatCard
            title="Growth Rate"
            value="12.8%"
            icon={TrendingUp}
            trend="up"
            trendValue="2.1% from last quarter"
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
            title="Quarterly Reports"
            value="15/15"
            icon={FileText}
            className="animate-fade-in [animation-delay:400ms]"
          />
        </div>

        <Card className="animate-fade-in [animation-delay:500ms]">
          <CardHeader>
            <CardTitle>Annual Department Performance</CardTitle>
            <CardDescription>
              Track performance indices across all departments throughout the year
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartCard
              title=""
              type="line"
              data={performanceData}
              dataKey="value"
              categories={["HR", "Sales", "Development", "Marketing", "Finance"]}
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
              <CardTitle>Resource Utilization</CardTitle>
              <CardDescription>
                Department resource efficiency metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartCard
                title=""
                type="radial-bar"
                data={resourceUtilizationData}
                dataKey="value"
                className="h-[300px]"
              />
            </CardContent>
          </Card>
        </div>

        <Card className="animate-fade-in [animation-delay:800ms]">
          <CardHeader>
            <CardTitle>Departmental KPIs</CardTitle>
            <CardDescription>
              Key performance indicators by department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="HR">
              <TabsList className="grid grid-cols-5">
                {departmentKPIs.map((dept) => (
                  <TabsTrigger key={dept.department} value={dept.department}>
                    {dept.department}
                  </TabsTrigger>
                ))}
              </TabsList>
              {departmentKPIs.map((dept) => (
                <TabsContent key={dept.department} value={dept.department} className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {dept.metrics.map((metric, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">{metric.name}</h3>
                          <span className={`text-sm font-medium ${
                            metric.value >= metric.target ? "text-green-500" : "text-amber-500"
                          }`}>
                            {metric.value}{metric.unit}
                          </span>
                        </div>
                        <Progress value={metric.value} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Target: {metric.target}{metric.unit}</span>
                          <span>
                            {metric.value >= metric.target 
                              ? `+${(metric.value - metric.target).toFixed(1)}${metric.unit}` 
                              : `-${(metric.target - metric.value).toFixed(1)}${metric.unit}`
                            }
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
