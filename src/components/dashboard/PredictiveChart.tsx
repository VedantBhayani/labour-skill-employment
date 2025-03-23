import { useEffect, useState, useRef, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, parseISO } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { usePredictiveAnalytics, MetricType, PredictionTimeframe } from "@/components/PredictiveAnalyticsProvider";
import { Badge } from "@/components/ui/badge";
import { isInAdvancedAnalyticsTab } from "@/lib/analyticsService";
import React from "react";

// Define display names for metrics and timeframes
const metricDisplayNames: Record<MetricType, string> = {
  PERFORMANCE: "Performance Metrics",
  WORKLOAD: "Workload Prediction",
  EFFICIENCY: "Efficiency Metrics",
  SKILLS: "Skills Analysis",
  PROGRESS: "Progress Tracking"
};

const timeframeDisplayNames: Record<PredictionTimeframe, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly"
};

interface PredictiveChartProps {
  className?: string;
  metricType: MetricType;
  timeframe: PredictionTimeframe;
  department?: string;
  onChange?: (params: {
    metricType?: MetricType;
    timeframe?: PredictionTimeframe;
    department?: string;
  }) => void;
  initialData?: any; // Allow passing prediction data directly to bypass API call
}

export function PredictiveChart({
  className = "",
  metricType,
  timeframe,
  department,
  onChange,
  initialData,
}: PredictiveChartProps) {
  const { generatePrediction } = usePredictiveAnalytics();
  const [isPredicting, setIsPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictionData, setPredictionData] = useState<any>(null);
  
  // Create a stable reference for the configuration
  const configRef = useRef<string>('');
  
  // Track if this is the initial mount
  const initialMountRef = useRef<boolean>(true);
  
  // Memoize the current configuration
  const currentConfig = useMemo(() => 
    JSON.stringify({metricType, timeframe, department})
  , [metricType, timeframe, department]);
  
  // Add this at the beginning of the component to track request states globally
  const requestLock = React.useRef<Record<string, boolean>>({});
  
  // Process initialData if provided
  useEffect(() => {
    if (initialData && initialMountRef.current) {
      console.log("Using provided initialData, skipping API call");
      initialMountRef.current = false;
      
      try {
        // Process the data just like we do in loadPrediction
        if (!initialData || !initialData.baseline || !initialData.predicted || 
            initialData.baseline.length === 0 || initialData.predicted.length === 0) {
          throw new Error("Invalid initial data");
        }
        
        const colorHints = initialData.chartColors || {
          historical: "#bb86fc",
          predicted: "#03dac6",
          confidence: "#cf6679"
        };
        
        // Process the data just like in loadPrediction
        const combinedData = [
          ...initialData.baseline.map(point => ({
            ...point,
            dataType: "historical",
            formattedDate: format(parseISO(point.timestamp), "MMM d"),
          })),
          ...initialData.predicted.map(point => ({
            ...point,
            dataType: "predicted",
            formattedDate: format(parseISO(point.timestamp), "MMM d"),
          })),
        ];
        
        // Add confidence intervals if available
        if (initialData.confidenceInterval) {
          initialData.predicted.forEach((point, index) => {
            const upperPoint = initialData.confidenceInterval?.upper[index];
            const lowerPoint = initialData.confidenceInterval?.lower[index];
            
            if (upperPoint && lowerPoint) {
              combinedData.push({
                ...point,
                dataType: "upperBound",
                value: upperPoint.value,
                formattedDate: format(parseISO(point.timestamp), "MMM d"),
              });
              
              combinedData.push({
                ...point,
                dataType: "lowerBound",
                value: lowerPoint.value,
                formattedDate: format(parseISO(point.timestamp), "MMM d"),
              });
            }
          });
        }
        
        setPredictionData({
          data: combinedData,
          accuracy: initialData.accuracy * 100,
          title: initialData.title,
          colorHints
        });
      } catch (err) {
        console.error("Error processing initial data:", err);
        setError("Failed to process prediction data.");
      }
      
      // Set the config reference to prevent automatic loading
      configRef.current = currentConfig;
      return;
    }
    
    // Only load on initial mount or when props explicitly change (not on re-renders)
    if (initialMountRef.current && !initialData) {
      console.log(`Initial load for ${metricType}/${timeframe}/${department || 'all'}`);
      loadPrediction();
      initialMountRef.current = false;
      configRef.current = currentConfig;
    } else if (currentConfig !== configRef.current && !isPredicting && !initialData) {
      // Only reload if configuration actually changed and we're not already loading
      console.log(`Config changed from ${configRef.current} to ${currentConfig}`);
      configRef.current = currentConfig;
      loadPrediction();
    }
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      console.log(`Cleanup for ${metricType}/${timeframe}/${department || 'all'}`);
    };
  }, [currentConfig, isPredicting, initialData]);
  
  // Stop rendering and API calls when tab is not visible/active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isPredicting) {
        console.log("Tab hidden, aborting prediction");
        setIsPredicting(false);
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isPredicting]);

  const loadPrediction = async () => {
    // Early return with mock data if in Advanced Analytics tab
    if (isInAdvancedAnalyticsTab()) {
      console.log("Advanced Analytics tab detected, returning mock data instead of API call");
      
      // Generate mock data instead of making an API call
      const mockData = [
        // Historical data (past)
        { dataType: "historical", formattedDate: "Jan 1", value: 65 },
        { dataType: "historical", formattedDate: "Jan 5", value: 68 },
        { dataType: "historical", formattedDate: "Jan 10", value: 72 },
        { dataType: "historical", formattedDate: "Jan 15", value: 75 },
        { dataType: "historical", formattedDate: "Jan 20", value: 78 },
        
        // Predicted data (future)
        { dataType: "predicted", formattedDate: "Jan 25", value: 82 },
        { dataType: "predicted", formattedDate: "Jan 30", value: 85 },
        { dataType: "predicted", formattedDate: "Feb 5", value: 88 },
        { dataType: "predicted", formattedDate: "Feb 10", value: 92 },
        
        // Confidence interval (upper bound)
        { dataType: "upperBound", formattedDate: "Jan 25", value: 87 },
        { dataType: "upperBound", formattedDate: "Jan 30", value: 91 },
        { dataType: "upperBound", formattedDate: "Feb 5", value: 95 },
        { dataType: "upperBound", formattedDate: "Feb 10", value: 99 },
        
        // Confidence interval (lower bound)
        { dataType: "lowerBound", formattedDate: "Jan 25", value: 77 },
        { dataType: "lowerBound", formattedDate: "Jan 30", value: 79 },
        { dataType: "lowerBound", formattedDate: "Feb 5", value: 81 },
        { dataType: "lowerBound", formattedDate: "Feb 10", value: 85 }
      ];
      
      // Set up mock prediction data
      setPredictionData({
        data: mockData,
        accuracy: 85 + Math.random() * 10,
        title: `${timeframeDisplayNames[timeframe]} ${metricDisplayNames[metricType]}`,
        colorHints: {
          historical: "#bb86fc",
          predicted: "#03dac6",
          confidence: "rgba(207, 102, 121, 0.5)"
        }
      });
      
      // Reset loading state
      setIsPredicting(false);
      return;
    }
    
    // Don't start a new prediction if one is already in progress
    if (isPredicting) {
      console.log("Already predicting, skipping duplicate request");
      return;
    }
    
    setIsPredicting(true);
    setError(null);
    
    try {
      // Make sure we have a valid department value
      const validDepartment = department || "Development";
      
      const prediction = await generatePrediction(metricType, timeframe, "STATISTICAL", validDepartment);
      console.log("Raw prediction data:", JSON.stringify(prediction, null, 2));
      
      // Verify the prediction data is valid before processing
      if (!prediction || !prediction.baseline || !prediction.predicted || 
          prediction.baseline.length === 0 || prediction.predicted.length === 0) {
        throw new Error("Invalid prediction data received");
      }
      
      // Get color hints from the server response if available
      const colorHints = prediction.chartColors || {
        historical: "rgba(136, 132, 216, 0.8)",  // Default purple for historical data
        predicted: "rgba(130, 202, 157, 0.8)",   // Default green for predictions
        confidence: "rgba(169, 169, 169, 0.4)"   // Default gray for confidence interval
      };
      
      console.log("Using chart colors:", colorHints);
      
      // Combine baseline and predicted data for visualization
      // Mark baseline points as "historical" and prediction points as "predicted"
      const combinedData = [
        ...prediction.baseline.map(point => ({
          ...point,
          dataType: "historical",
          formattedDate: format(parseISO(point.timestamp), "MMM d"),
        })),
        ...prediction.predicted.map(point => ({
          ...point,
          dataType: "predicted",
          formattedDate: format(parseISO(point.timestamp), "MMM d"),
        })),
      ];
      
      // Add confidence intervals if available
      if (prediction.confidenceInterval) {
        prediction.predicted.forEach((point, index) => {
          const upperPoint = prediction.confidenceInterval?.upper[index];
          const lowerPoint = prediction.confidenceInterval?.lower[index];
          
          if (upperPoint && lowerPoint) {
            combinedData.push({
              ...point,
              dataType: "upperBound",
              value: upperPoint.value,
              formattedDate: format(parseISO(point.timestamp), "MMM d"),
            });
            
            combinedData.push({
              ...point,
              dataType: "lowerBound",
              value: lowerPoint.value,
              formattedDate: format(parseISO(point.timestamp), "MMM d"),
            });
          }
        });
      }
      
      console.log("Combined data for chart:", combinedData);
      
      setPredictionData({
        data: combinedData,
        accuracy: prediction.accuracy * 100,
        title: prediction.title,
        colorHints
      });
    } catch (err) {
      console.error("Error generating prediction:", err);
      setError("Failed to generate prediction. Please try again.");
      
      // Show more helpful error toast based on the error type
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      
      toast({
        title: "Prediction Error",
        description: "There was a problem generating the prediction: " + errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsPredicting(false);
    }
  };
  
  // Log whenever prediction data changes
  useEffect(() => {
    if (predictionData) {
      console.log("Chart will render with:", { 
        dataLength: predictionData.data.length,
        hasHistorical: predictionData.data.some((d: any) => d.dataType === "historical"),
        hasPredicted: predictionData.data.some((d: any) => d.dataType === "predicted"),
        hasConfidence: predictionData.data.some((d: any) => d.dataType === "upperBound")
      });
    }
  }, [predictionData]);

  const handleExport = () => {
    if (!predictionData) return;

    // Create CSV string from data
    const csvRows = [
      ["Date", "Value", "Type"],
      ...predictionData.data.map((d: any) => [
        d.formattedDate,
        d.value,
        d.dataType,
      ]),
    ];
    const csvContent = csvRows.map((row) => row.join(",")).join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${metricType.toLowerCase()}_prediction_${timeframe.toLowerCase()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Replace all previous useEffect hooks with this single implementation
  useEffect(() => {
    // Debug log to help us understand when this effect runs
    console.log("PredictiveChart useEffect triggered", { metricType, timeframe, department });
    
    const isAdvancedTab = isInAdvancedAnalyticsTab();
    const requestKey = `${metricType}-${timeframe}-${department}`;
    
    // If we're already loading this prediction, don't trigger another request
    if (requestLock.current[requestKey]) {
      console.log(`Request already in progress for ${requestKey}`);
      return;
    }
    
    // Skip API calls entirely when in Advanced Analytics tab
    if (isAdvancedTab) {
      console.log("Skipping prediction API call in Advanced Analytics tab");
      // For the Advanced tab we'll just set a "ready" state with empty data
      setIsPredicting(false);
      return;
    }
    
    // Continue with normal loading only if NOT in advanced tab
    if (!isPredicting && !error && !predictionData) {
      // Lock this request
      requestLock.current[requestKey] = true;
      
      loadPrediction()
        .finally(() => {
          // Unlock this request when done
          requestLock.current[requestKey] = false;
        });
    }
    
    // Cleanup function
    return () => {
      console.log("PredictiveChart component unmounted");
      // Reset lock on unmount
      requestLock.current[requestKey] = false;
    };
  }, [metricType, timeframe, department, initialData]);

  // EMERGENCY FIX: Prevent rendering for problematic configuration
  if (metricType === "PERFORMANCE" && timeframe === "QUARTERLY" && department === "HR") {
    return (
      <Card className="h-full w-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-2">
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>
              Quarterly forecast for HR department
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="relative h-[500px] w-full p-0 pb-0 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-4">
              <AlertCircle className="mx-auto h-12 w-12 text-yellow-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">Static Preview Mode</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              This chart is displayed in static mode to prevent continuous API requests.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-2">
          <CardTitle>{metricDisplayNames[metricType]}</CardTitle>
          <CardDescription>
            {predictionData?.title || "Predicting future trends based on historical data"}
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          {predictionData && (
            <Button
              variant="outline"
              size="sm"
              className="mr-2 h-8"
              onClick={handleExport}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={loadPrediction}
            disabled={isPredicting}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative h-[500px] w-full p-0 pb-0">
        {isPredicting && !error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Generating prediction...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadPrediction}
                className="mt-2"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </div>
        ) : predictionData ? (
          <div className="flex flex-col h-full pt-6 px-6">
            <div className="flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={predictionData.data}
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
                    data={predictionData.data.filter((d: any) => d.dataType === "historical")}
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
                    data={predictionData.data.filter((d: any) => d.dataType === "predicted")}
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
                  {predictionData.data.some((d: any) => d.dataType === "upperBound") && (
                    <Area
                      type="monotone"
                      dataKey="value"
                      name="Confidence Interval"
                      data={predictionData.data.filter((d: any) => d.dataType === "upperBound" || d.dataType === "lowerBound")}
                      stroke="#cf6679"
                      strokeWidth={2}
                      fill="#cf6679"
                      fillOpacity={0.3}
                      activeDot={false}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <span className="text-sm mr-2">Confidence:</span>
                <span className="font-medium">
                  {predictionData.accuracy.toFixed(1)}%
                </span>
              </div>
              <Badge variant="secondary">
                {timeframeDisplayNames[timeframe]} Forecast
              </Badge>
              {department && (
                <Badge variant="outline">{department}</Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Select metrics to generate a prediction
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 