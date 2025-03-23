import React, { useState } from "react";
import { 
  BrainCircuit, 
  LayoutDashboard, 
  Settings, 
  FileText, 
  Plus, 
  RefreshCw,
  Download,
  Share2,
  Search,
  Sliders,
  PlusCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { PredictiveChart } from "@/components/dashboard/PredictiveChart";
import { CustomizableDashboard } from "@/components/dashboard/CustomizableDashboard";
import { ResourceOptimizationCard } from "@/components/dashboard/ResourceOptimizationCard";
import { ScheduledReportsCard } from "@/components/dashboard/ScheduledReportsCard";
import { usePredictiveAnalytics, MetricType, PredictionTimeframe } from "@/components/PredictiveAnalyticsProvider";
import { useDepartments } from "@/components/DepartmentsProvider";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const AdvancedAnalytics = () => {
  const [activeTab, setActiveTab] = useState("predictive");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreatingPrediction, setIsCreatingPrediction] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<PredictionTimeframe>("QUARTERLY");
  const [selectedMetricType, setSelectedMetricType] = useState<MetricType>("PERFORMANCE");
  const [selectedDashboard, setSelectedDashboard] = useState<string | undefined>(undefined);
  
  const { predictions, generatePrediction, dashboards, getDefaultDashboard, getDashboardById, createDashboard, updateDashboard } = usePredictiveAnalytics();
  const { departments } = useDepartments();
  
  // Get the two most recent predictions to display
  const recentPredictions = predictions
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 2);
  
  // Handle refresh analytics
  const handleRefreshAnalytics = () => {
    setIsRefreshing(true);
    
    // Simulate refresh with a delay
    setTimeout(() => {
      // Generate a new prediction
      generatePrediction(
        selectedMetricType as any, 
        selectedTimeframe as any
      );
      
      setIsRefreshing(false);
      toast({
        title: "Analytics Refreshed",
        description: "Predictions have been recalculated with the latest data"
      });
    }, 1500);
  };
  
  // Handle export
  const handleExport = (format: string) => {
    toast({
      title: `Analytics exported as ${format.toUpperCase()}`,
      description: "Your analytics data has been exported successfully"
    });
  };
  
  // Handle share
  const handleShare = () => {
    toast({
      title: "Share link generated",
      description: "A shareable link has been copied to your clipboard"
    });
  };
  
  // Handle create prediction
  const handleCreatePrediction = async () => {
    if (!selectedMetricType || !selectedTimeframe) {
      toast({
        title: "Invalid Selection",
        description: "Please select both a metric type and timeframe for the prediction.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingPrediction(true);
    
    try {
      // Get a valid department name
      const departmentName = departments && departments.length > 0 
        ? departments[0].name || "Development" 
        : "Development"; // Fallback to a default department name if none available
      
      // Call the context method which uses the API service
      const newPrediction = await generatePrediction(
        selectedMetricType,
        selectedTimeframe,
        'STATISTICAL',
        departmentName
      );
      
      toast({
        title: "Prediction Generated",
        description: `${newPrediction.title} has been generated successfully.`,
      });
      
      // Close the dialog
      setIsCreateDialogOpen(false);
      
      // Reset selections - use default values instead of undefined
      setSelectedMetricType("PERFORMANCE");
      setSelectedTimeframe("QUARTERLY");
    } catch (error) {
      console.error("Error creating prediction:", error);
      toast({
        title: "Prediction Failed",
        description: "There was an error generating the prediction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingPrediction(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered insights, predictions, and resource optimization
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus size={16} />
                New Prediction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Prediction</DialogTitle>
                <DialogDescription>
                  Generate a new AI-based prediction for the selected metric and timeframe.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="metric-type" className="text-sm font-medium">
                    Metric Type
                  </label>
                  <Select 
                    value={selectedMetricType} 
                    onValueChange={(value) => setSelectedMetricType(value as MetricType)}
                  >
                    <SelectTrigger id="metric-type">
                      <SelectValue placeholder="Select metric type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Department Metrics</SelectLabel>
                        <SelectItem value="PERFORMANCE">Performance</SelectItem>
                        <SelectItem value="EFFICIENCY">Efficiency</SelectItem>
                        <SelectItem value="SKILLS">Skills Gap</SelectItem>
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Resource Metrics</SelectLabel>
                        <SelectItem value="WORKLOAD">Workload</SelectItem>
                        <SelectItem value="PROGRESS">Project Progress</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="timeframe" className="text-sm font-medium">
                    Prediction Timeframe
                  </label>
                  <Select 
                    value={selectedTimeframe} 
                    onValueChange={(value) => setSelectedTimeframe(value as PredictionTimeframe)}
                  >
                    <SelectTrigger id="timeframe">
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEEKLY">Weekly (Next 7 Days)</SelectItem>
                      <SelectItem value="MONTHLY">Monthly (Next 30 Days)</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly (Next 3 Months)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePrediction}>
                  Generate Prediction
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleRefreshAnalytics}
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            Refresh
          </Button>
          
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
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Export as PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Export as Excel</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Export as CSV</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                <span>Share Analytics</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="predictive">
            <BrainCircuit className="mr-2 h-4 w-4" />
            Predictive Analytics
          </TabsTrigger>
          <TabsTrigger value="resource">
            <Sliders className="mr-2 h-4 w-4" />
            Resource Optimization
          </TabsTrigger>
          <TabsTrigger value="dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Custom Dashboards
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="predictive" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">Predictive Analytics</h2>
              <p className="text-muted-foreground">
                AI-generated forecasts and predictions based on historical data
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative w-[250px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search"
                  placeholder="Search predictions..." 
                  className="pl-8"
                />
              </div>
              
              <Select defaultValue="latest">
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter predictions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest First</SelectItem>
                  <SelectItem value="accuracy">Highest Accuracy</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="workload">Workload</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {recentPredictions.length > 0 ? (
              recentPredictions.map(prediction => (
                <Card key={prediction._id} className="animate-fade-in">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{prediction.title}</CardTitle>
                        <CardDescription>{prediction.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Settings className="mr-2 h-4 w-4" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PredictiveChart
                      title={prediction.title}
                      description={prediction.description}
                      metricType={prediction.metricType}
                      timeframe={prediction.timeframe}
                      department={prediction.department}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-between text-sm text-muted-foreground">
                    <div>
                      Created: {new Date(prediction.createdAt).toLocaleDateString()}
                    </div>
                    <div>
                      Model: {prediction.model}
                    </div>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BrainCircuit className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No predictions yet</h3>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Create your first AI-powered prediction to get started with advanced analytics
                </p>
                <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Prediction
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex justify-center">
            <Button variant="outline">
              View All Predictions
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="resource" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">Resource Optimization</h2>
              <p className="text-muted-foreground">
                AI-driven recommendations for optimal resource allocation
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleRefreshAnalytics} disabled={isRefreshing}>
                <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
                Update Analytics
              </Button>
            </div>
          </div>
          
          <ResourceOptimizationCard className="animate-fade-in" />
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Skill Gap Analysis</CardTitle>
                <CardDescription>
                  AI-identified skill gaps and training recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Based on team skills assessment and project requirements
                  </p>

                  <SkillsAnalysisPlaceholder />
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View Detailed Skill Gap Report
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Team Composition Optimizer</CardTitle>
                <CardDescription>
                  Suggestions for optimal team formation based on skills and workload
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    AI-calculated optimal team compositions to maximize productivity
                  </p>

                  <TeamCompositionPlaceholder />
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View Detailed Team Composition Report
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="dashboard" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">Custom Dashboards</h2>
              <p className="text-muted-foreground">
                Create and manage personalized analytics dashboards
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Select
                    value={selectedDashboard || ''}
                    onValueChange={(value) => {
                      if (value) {
                        const dashboard = dashboards.find(d => d._id === value);
                        setSelectedDashboard(value);
                      }
                    }}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select Dashboard" />
                    </SelectTrigger>
                    <SelectContent>
                      {dashboards.map(dashboard => (
                        <SelectItem key={dashboard._id} value={dashboard._id}>
                          {dashboard.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      createDashboard({
                        name: `Dashboard ${dashboards.length + 1}`,
                        description: 'Custom dashboard for analytics',
                        layout: { widgets: [] },
                        isDefault: dashboards.length === 0
                      });
                    }}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create New Dashboard
                  </Button>
                </div>
                
                {selectedDashboard && (
                  <div>
                    <CustomizableDashboard
                      dashboard={getDashboardById(selectedDashboard)!}
                      onSave={updateDashboard}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>
                Set up automated reports and alert notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScheduledReportsCard />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Skills Analysis Placeholder Component
const SkillsAnalysisPlaceholder = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h4 className="font-medium">Top Missing Skills</h4>
        <p className="text-sm text-muted-foreground">Skills with lowest coverage</p>
      </div>
      <Badge variant="outline">Coming Soon</Badge>
    </div>
    
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <span className="text-sm">Advanced Data Analysis</span>
          <Progress value={15} className="h-2 mt-1" />
        </div>
        <span className="text-sm ml-4 tabular-nums">15%</span>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <span className="text-sm">Machine Learning</span>
          <Progress value={22} className="h-2 mt-1" />
        </div>
        <span className="text-sm ml-4 tabular-nums">22%</span>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <span className="text-sm">Cloud Architecture</span>
          <Progress value={35} className="h-2 mt-1" />
        </div>
        <span className="text-sm ml-4 tabular-nums">35%</span>
      </div>
    </div>
  </div>
);

// Team Composition Placeholder Component
const TeamCompositionPlaceholder = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h4 className="font-medium">Recommended Team Structure</h4>
        <p className="text-sm text-muted-foreground">For current project portfolio</p>
      </div>
      <Badge variant="outline">Coming Soon</Badge>
    </div>
    
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
            <span className="text-xs font-medium">FE</span>
          </div>
          <span>Frontend Developer</span>
        </div>
        <span className="font-medium">4</span>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
            <span className="text-xs font-medium">BE</span>
          </div>
          <span>Backend Developer</span>
        </div>
        <span className="font-medium">5</span>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
            <span className="text-xs font-medium">QA</span>
          </div>
          <span>QA Engineer</span>
        </div>
        <span className="font-medium">3</span>
      </div>
    </div>
  </div>
);

export default AdvancedAnalytics; 