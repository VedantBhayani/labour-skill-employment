import React, { useState, useEffect } from "react";
import { 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowRight, 
  RefreshCw,
  BarChart,
  LifeBuoy,
  Loader2
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDepartments } from "@/components/DepartmentsProvider";
import { usePredictiveAnalytics, ResourceOptimization } from "@/components/PredictiveAnalyticsProvider";
import { toast } from "@/hooks/use-toast";

interface ResourceOptimizationCardProps {
  className?: string;
}

export function ResourceOptimizationCard({ className = "" }: ResourceOptimizationCardProps) {
  const { departments } = useDepartments();
  const { getOptimalResourceAllocation } = usePredictiveAnalytics();
  const [selectedDepartment, setSelectedDepartment] = useState(departments[0]?.name || "");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<ResourceOptimization[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Load recommendations when department changes
  useEffect(() => {
    if (selectedDepartment) {
      loadRecommendations();
    }
  }, [selectedDepartment]);
  
  // Load optimization recommendations
  const loadRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getOptimalResourceAllocation(selectedDepartment);
      setRecommendations(data);
    } catch (err) {
      console.error('Error loading optimization recommendations:', err);
      setError('Failed to load resource optimization data');
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate potential efficiency gain
  const totalGain = recommendations.reduce((acc, rec) => acc + rec.potentialGain, 0);
  const averageGain = recommendations.length > 0 ? 
    totalGain / recommendations.length : 
    0;
  
  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      await loadRecommendations();
      toast({
        title: "Recommendations Refreshed",
        description: "AI workload optimization has been recalculated with the latest data."
      });
    } catch (err) {
      toast({
        title: "Refresh Failed",
        description: "There was a problem refreshing the optimization recommendations.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Handle apply recommendations
  const handleApplyRecommendations = () => {
    toast({
      title: "Recommendations Applied",
      description: "The suggested workload changes have been communicated to team leads."
    });
  };
  
  // Get arrow icon based on difference
  const getChangeIcon = (current: number, recommended: number) => {
    const diff = recommended - current;
    
    if (diff > 5) {
      return <ArrowUpRight className="h-4 w-4 text-red-500" />;
    } else if (diff < -5) {
      return <ArrowDownRight className="h-4 w-4 text-green-500" />;
    } else {
      return <ArrowRight className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  // Get status badge for recommendations
  const getStatusBadge = (current: number, recommended: number) => {
    const diff = Math.abs(current - recommended);
    
    if (diff > 15) {
      return <Badge variant="destructive">Critical</Badge>;
    } else if (diff > 10) {
      return <Badge variant="secondary">Significant</Badge>;
    } else if (diff > 5) {
      return <Badge>Minor</Badge>;
    } else {
      return <Badge variant="outline">Optimal</Badge>;
    }
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="space-y-0 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              AI Resource Optimization
            </CardTitle>
            <CardDescription>
              Workload distribution recommendations based on AI analysis
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground py-8">
            <Loader2 className="h-16 w-16 mb-4 animate-spin opacity-30" />
            <p className="text-center">Loading optimization recommendations...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground py-8">
            <BarChart className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-center">{error}</p>
            <Button variant="outline" onClick={loadRecommendations} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : !selectedDepartment ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground py-8">
            <BarChart className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-center">Select a department to see resource optimization recommendations</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground py-8">
            <LifeBuoy className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-center">No team members found in this department</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Card className="bg-muted/40">
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Potential Efficiency Gain</p>
                    <p className="text-2xl font-bold">{(averageGain * 100).toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">
                      Average improvement across all team members
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-muted/40">
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Workload Balance Status</p>
                    <p className="text-2xl font-bold">
                      {averageGain > 0.15 
                        ? "Needs Attention" 
                        : averageGain > 0.08 
                        ? "Imbalanced" 
                        : "Balanced"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Based on current task distribution
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Member</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-center">Change</TableHead>
                    <TableHead className="text-right">Recommended</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recommendations.map((rec) => (
                    <TableRow key={rec.memberId}>
                      <TableCell className="font-medium">{rec.memberName}</TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="cursor-default">
                              <div className="flex items-center justify-end gap-2">
                                <span>{rec.currentLoad}%</span>
                                <div className="w-16">
                                  <Progress value={rec.currentLoad} className="h-2" />
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Current workload: {rec.currentLoad}%</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-center">
                        {getChangeIcon(rec.currentLoad, rec.recommendedLoad)}
                      </TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="cursor-default">
                              <div className="flex items-center justify-end gap-2">
                                <span>{rec.recommendedLoad}%</span>
                                <div className="w-16">
                                  <Progress value={rec.recommendedLoad} className="h-2" />
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Recommended workload: {rec.recommendedLoad}%</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-right">
                        {getStatusBadge(rec.currentLoad, rec.recommendedLoad)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button onClick={handleApplyRecommendations}>
                Apply Recommendations
              </Button>
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="pt-2">
        <div className="w-full text-xs text-muted-foreground">
          Based on AI analysis of current workload distribution and team capacity.
        </div>
      </CardFooter>
    </Card>
  );
} 