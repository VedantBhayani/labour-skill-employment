import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useTasks } from './TasksProvider';
import { useDepartments } from './DepartmentsProvider';
import { useAuth } from './AuthProvider';
import { toast } from "@/hooks/use-toast";
import { analyticsService, 
  DepartmentPerformance,
  WorkloadData,
  EfficiencyData,
  SkillsData,
  Prediction,
  DataPoint,
  ScheduledReport,
  Dashboard,
  WidgetLayout,
  MetricType,
  Timeframe,
  WidgetType 
} from '@/lib/analyticsService';

// Types
export type PredictionModel = 'STATISTICAL' | 'LINEAR' | 'EXPONENTIAL' | 'MACHINE_LEARNING';

// Re-export types from analyticsService for backward compatibility
export {
  type MetricType,
  type Timeframe as PredictionTimeframe,
  type Timeframe as ScheduleFrequency
};

// Mapping from API data structures to existing component interfaces
export type PredictionResult = {
  _id: string;
  title: string;
  description: string;
  metricType: MetricType;
  timeframe: Timeframe;
  model: PredictionModel;
  baseline: { timestamp: string; value: number }[];
  predicted: { timestamp: string; value: number }[];
  confidenceInterval?: {
    upper: { timestamp: string; value: number }[];
    lower: { timestamp: string; value: number }[];
  };
  accuracy: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  department: string;
  chartColors?: {
    historical: string;
    predicted: string;
    confidence: string;
  };
};

export interface ReportSchedule extends Omit<ScheduledReport, 'recipients'> {
  recipients: string[];
}

export interface AnalyticsDashboard extends Omit<Dashboard, 'layout'> {
  layout: DashboardLayout;
}

export interface DashboardLayout {
  widgets: Array<{
    id: string;
    type: WidgetType;
    title: string;
    dataSource: string;
    metricType: MetricType;
    size: 'small' | 'medium' | 'large';
    position: {
      x: number;
      y: number;
      w: number;
      h: number;
    };
  }>;
}

export interface ResourceOptimization {
  memberId: string;
  memberName: string;
  currentLoad: number;
  recommendedLoad: number;
  potentialGain: number;
  reasonForChange: string;
}

interface PredictiveAnalyticsContextType {
  predictions: PredictionResult[];
  reportSchedules: ReportSchedule[];
  scheduledReports: ReportSchedule[];
  dashboards: AnalyticsDashboard[];
  isLoading: boolean;
  hasError: boolean;
  generatePrediction: (
    metricType: MetricType,
    timeframe: Timeframe,
    model?: PredictionModel,
    department?: string
  ) => Promise<PredictionResult>;
  createScheduledReport: (report: Partial<ReportSchedule>) => Promise<ReportSchedule>;
  updateScheduledReport: (report: ReportSchedule) => Promise<void>;
  deleteScheduledReport: (id: string) => Promise<void>;
  runScheduledReport: (id: string) => Promise<void>;
  createDashboard: (dashboard: Partial<AnalyticsDashboard>) => Promise<AnalyticsDashboard>;
  updateDashboard: (dashboard: AnalyticsDashboard) => Promise<void>;
  deleteDashboard: (id: string) => Promise<void>;
  getWorkloadPrediction: (department: string, timeframe: Timeframe) => Promise<DataPoint[]>;
  getResourceUtilizationPrediction: (department: string, timeframe: Timeframe) => Promise<DataPoint[]>;
  getOptimalResourceAllocation: (departmentName: string) => Promise<ResourceOptimization[]>;
  getDashboardById: (id: string) => AnalyticsDashboard | undefined;
  getDefaultDashboard: () => AnalyticsDashboard | undefined;
  getReportScheduleById: (id: string) => ReportSchedule | undefined;
  getPredictionById: (id: string) => PredictionResult | undefined;
  refreshData: () => Promise<void>;
}

const PredictiveAnalyticsContext = createContext<PredictiveAnalyticsContextType | undefined>(undefined);

// Helper function to convert API prediction to PredictionResult
const mapApiPredictionToResult = (prediction: Prediction): PredictionResult => {
  return {
    ...prediction,
    model: prediction.model as PredictionModel,
    timeframe: prediction.timeframe,
    // Ensure format compatibility
    confidenceInterval: prediction.confidenceInterval ? {
      upper: prediction.confidenceInterval.upper,
      lower: prediction.confidenceInterval.lower
    } : undefined
  };
};

// Helper function to convert API scheduled report to ReportSchedule
const mapApiReportToSchedule = (report: ScheduledReport): ReportSchedule => {
  return {
    ...report,
    recipients: report.recipients.map(r => r.email)
  };
};

// Helper function to convert API dashboard to AnalyticsDashboard
const mapApiDashboardToDashboard = (dashboard: Dashboard): AnalyticsDashboard => {
  // Map the API layout structure to the expected format
  const widgetLayout: DashboardLayout = {
    widgets: dashboard.layout.map(widget => ({
      id: widget.id,
      type: widget.type,
      title: widget.title,
      dataSource: widget.dataSource.predictionId || 
                 `${widget.dataSource.type}-${widget.dataSource.department || 'all'}`,
      metricType: widget.dataSource.type,
      size: getSizeFromDimensions(widget.position.w, widget.position.h),
      position: widget.position
    }))
  };

  return {
    ...dashboard,
    layout: widgetLayout
  };
};

// Helper to determine widget size based on dimensions
const getSizeFromDimensions = (w: number, h: number): 'small' | 'medium' | 'large' => {
  const area = w * h;
  if (area <= 4) return 'small';
  if (area <= 8) return 'medium';
  return 'large';
};

// Initial prediction results (fallback if API fails)
const INITIAL_PREDICTIONS: PredictionResult[] = [
  {
    _id: "mock-prediction-1",
    title: "Performance Forecast",
    description: "Predicted performance for next quarter",
    metricType: "PERFORMANCE",
    timeframe: "QUARTERLY",
    model: "STATISTICAL",
    department: "Development",
    baseline: Array(6).fill(0).map((_, i) => ({ 
      timestamp: new Date(Date.now() - (5-i) * 86400000).toISOString(), 
      value: 70 + Math.floor(Math.random() * 20) 
    })),
    predicted: Array(6).fill(0).map((_, i) => ({ 
      timestamp: new Date(Date.now() + i * 86400000).toISOString(), 
      value: 75 + Math.floor(Math.random() * 15) 
    })),
    confidenceInterval: {
      upper: Array(6).fill(0).map((_, i) => ({ 
        timestamp: new Date(Date.now() + i * 86400000).toISOString(), 
        value: 80 + Math.floor(Math.random() * 15) 
      })),
      lower: Array(6).fill(0).map((_, i) => ({ 
        timestamp: new Date(Date.now() + i * 86400000).toISOString(), 
        value: 65 + Math.floor(Math.random() * 15) 
      }))
    },
    accuracy: 0.85,
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Initial scheduled reports (fallback if API fails)
const INITIAL_SCHEDULES: ReportSchedule[] = [];

// Initial dashboard layouts (fallback if API fails)
const INITIAL_DASHBOARDS: AnalyticsDashboard[] = [
  {
    _id: "default-dashboard",
    name: "Default Dashboard",
    description: "Main analytics dashboard",
    layout: {
      widgets: [
        {
          id: "widget-1",
          type: "chart",
          title: "Performance Trends",
          dataSource: "mock-prediction-1",
          metricType: "PERFORMANCE",
          size: "medium",
          position: { x: 0, y: 0, w: 2, h: 2 }
        }
      ]
    },
    isDefault: true,
    departments: [],
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const PredictiveAnalyticsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [predictions, setPredictions] = useState<PredictionResult[]>(INITIAL_PREDICTIONS);
  const [scheduledReports, setScheduledReports] = useState<ReportSchedule[]>(INITIAL_SCHEDULES);
  const [dashboards, setDashboards] = useState<AnalyticsDashboard[]>(INITIAL_DASHBOARDS);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const { user } = useAuth();
  const { departments } = useDepartments();
  const { tasks } = useTasks();
  
  // Load initial data
  useEffect(() => {
    refreshData();
  }, []);
  
  // Refresh all analytics data
  const refreshData = async () => {
    setIsLoading(true);
    setHasError(false);
    
    try {
      // First check if we are in offline mode and user wants to retry
      const isOffline = localStorage.getItem('analytics_offline_mode') === 'true';
      if (isOffline) {
        // Clear offline mode to try real server again
        analyticsService.resetOfflineMode();
      }

      // Use Promise.allSettled to handle partial failures
      const [predictionsResult, reportsResult, dashboardsResult] = await Promise.allSettled([
        analyticsService.getAllPredictions(),
        analyticsService.getAllScheduledReports(),
        analyticsService.getAllDashboards()
      ]);
      
      // Handle predictions
      if (predictionsResult.status === 'fulfilled') {
        setPredictions(predictionsResult.value.map(mapApiPredictionToResult));
      } else {
        console.error('Error loading predictions:', predictionsResult.reason);
        // Keep existing predictions or fallback to initial ones if none exist
        setPredictions(prev => prev.length ? prev : INITIAL_PREDICTIONS);
      }
      
      // Handle reports
      if (reportsResult.status === 'fulfilled') {
        setScheduledReports(reportsResult.value.map(mapApiReportToSchedule));
      } else {
        console.error('Error loading reports:', reportsResult.reason);
        // Keep existing reports or fallback to initial ones if none exist
        setScheduledReports(prev => prev.length ? prev : INITIAL_SCHEDULES);
      }
      
      // Handle dashboards
      if (dashboardsResult.status === 'fulfilled') {
        setDashboards(dashboardsResult.value.map(mapApiDashboardToDashboard));
      } else {
        console.error('Error loading dashboards:', dashboardsResult.reason);
        // Keep existing dashboards or fallback to initial ones if none exist
        setDashboards(prev => prev.length ? prev : INITIAL_DASHBOARDS);
      }
      
      // If any promise was rejected, we still have an error
      if ([predictionsResult, reportsResult, dashboardsResult].some(result => result.status === 'rejected')) {
        setHasError(true);
        
        const errorReason = [predictionsResult, reportsResult, dashboardsResult]
          .find(result => result.status === 'rejected') as PromiseRejectedResult;
          
        // Check if this is a connection error
        const isConnectionError = errorReason.reason?.isConnectionError;
          
        // Show error toast but continue with fallback data
        toast({
          title: 'Error loading analytics',
          description: isConnectionError 
            ? 'No connection to the analytics server. Using offline mode with cached data.'
            : errorReason.reason?.friendlyMessage || 'There was a problem loading your analytics data',
          variant: 'destructive'
        });
      } else {
        // All promises were fulfilled, clear any error state and show success message
        setHasError(false);
        
        if (isOffline) {
          toast({
            title: 'Connected to analytics server',
            description: 'Successfully connected to the analytics server and loaded fresh data.',
          });
        }
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
      setHasError(true);
      
      toast({
        title: 'Error loading analytics',
        description: error?.friendlyMessage || 'There was a problem loading your analytics data',
        variant: 'destructive'
      });
      
      // Ensure we have fallback data
      setPredictions(prev => prev.length ? prev : INITIAL_PREDICTIONS);
      setScheduledReports(prev => prev.length ? prev : INITIAL_SCHEDULES);
      setDashboards(prev => prev.length ? prev : INITIAL_DASHBOARDS);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate a new prediction
  const generatePrediction = async (
    metricType: MetricType,
    timeframe: Timeframe,
    model: PredictionModel = 'STATISTICAL',
    department?: string
  ): Promise<PredictionResult> => {
    try {
      // Use the current user's department if none specified
      const departmentId = department || user?.department || (departments[0] && departments[0].id) || 'Development';
      
      // Create the prediction via API
      const newPrediction = await analyticsService.createPrediction({
        metricType,
        timeframe,
        department: departmentId
      });
      
      // Map API response to our format
      const mappedPrediction = mapApiPredictionToResult(newPrediction);
      
      // Update state
      setPredictions(prevPredictions => [mappedPrediction, ...prevPredictions]);
      
      return mappedPrediction;
    } catch (error) {
      console.error('Error generating prediction:', error);
      
      // Create a helpful error message
      let errorMessage = 'There was a problem creating your prediction';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'friendlyMessage' in error) {
        errorMessage = error.friendlyMessage as string;
      }
      
      toast({
        title: 'Error generating prediction',
        description: errorMessage,
        variant: 'destructive'
      });
      
      // Create a more robust fallback prediction with sample data
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - 30); // 30 days in the past
      
      // Generate historical baseline data points
      const baseline = Array(6).fill(0).map((_, i) => {
        const pointDate = new Date(startDate);
        pointDate.setDate(startDate.getDate() + i * 5); // 5 day intervals
        return {
          timestamp: pointDate.toISOString(),
          value: 70 + Math.floor(Math.random() * 20), // random value between 70-90
        };
      });
      
      // Generate future prediction data points
      const predicted = Array(6).fill(0).map((_, i) => {
        const pointDate = new Date(now);
        pointDate.setDate(now.getDate() + i * 5); // 5 day intervals
        return {
          timestamp: pointDate.toISOString(),
          value: 75 + Math.floor(Math.random() * 15), // random value between 75-90
        };
      });
      
      // Generate confidence intervals
      const upperValues = predicted.map(p => ({
        timestamp: p.timestamp,
        value: p.value + 5 + Math.floor(Math.random() * 10), // 5-15 units higher
      }));
      
      const lowerValues = predicted.map(p => ({
        timestamp: p.timestamp,
        value: p.value - 5 - Math.floor(Math.random() * 10), // 5-15 units lower
      }));
      
      const fallbackPrediction: PredictionResult = {
        _id: uuidv4(),
        title: `${timeframe} ${metricType} Forecast (Offline Mode)`,
        description: 'Predicted using local fallback mode due to API error',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeframe,
        model,
        metricType,
        baseline,
        predicted,
        confidenceInterval: {
          upper: upperValues,
          lower: lowerValues
        },
        accuracy: 0.85,
        createdBy: user?.id || 'system',
        department: department || user?.department || (departments[0] && departments[0].id) || 'Development'
      };
      
      return fallbackPrediction;
    }
  };

  // Create a scheduled report
  const createScheduledReport = async (report: Partial<ReportSchedule>): Promise<ReportSchedule> => {
    try {
      // Format recipients as expected by API
      const apiRecipients = (report.recipients || []).map(email => ({ email }));
      
      // Create via API
      const newReport = await analyticsService.createScheduledReport({
        name: report.name || 'New Report',
        description: report.description,
        metricType: report.metricType as MetricType,
        timeframe: report.timeframe as Timeframe,
        recipients: apiRecipients,
        includeDataExport: report.includeDataExport,
        includeVisualizations: report.includeVisualizations,
        department: report.department || user?.department || (departments[0] && departments[0].id),
        isActive: report.isActive
      });
      
      // Map to our format
      const mappedReport = mapApiReportToSchedule(newReport);
      
      // Update state
      setScheduledReports(prev => [mappedReport, ...prev]);
      
      return mappedReport;
    } catch (error) {
      console.error('Error creating scheduled report:', error);
      toast({
        title: 'Error creating report',
        description: 'There was a problem creating your scheduled report',
        variant: 'destructive'
      });
      
      // Return empty report to maintain flow
      return {
        _id: uuidv4(),
        name: report.name || 'Failed Report',
        description: report.description || '',
        metricType: report.metricType as MetricType || 'PERFORMANCE',
        timeframe: report.timeframe as Timeframe || 'WEEKLY',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        recipients: report.recipients || [],
        includeDataExport: report.includeDataExport || false,
        includeVisualizations: report.includeVisualizations || true,
        isActive: report.isActive || false,
        department: report.department || '',
        createdBy: user?.id || ''
      };
    }
  };

  // Update a scheduled report
  const updateScheduledReport = async (report: ReportSchedule): Promise<void> => {
    try {
      // Format for API
      const apiRecipients = report.recipients.map(email => ({ email }));
      
      // Update via API
      await analyticsService.updateScheduledReport(report._id, {
        ...report,
        recipients: apiRecipients
      });
      
      // Update state
      setScheduledReports(prev => 
        prev.map(r => r._id === report._id ? report : r)
      );
    } catch (error) {
      console.error('Error updating scheduled report:', error);
      toast({
        title: 'Error updating report',
        description: 'There was a problem updating your scheduled report',
        variant: 'destructive'
      });
    }
  };

  // Delete a scheduled report
  const deleteScheduledReport = async (id: string): Promise<void> => {
    try {
      // Delete via API
      await analyticsService.deleteScheduledReport(id);
      
      // Update state
      setScheduledReports(prev => prev.filter(r => r._id !== id));
    } catch (error) {
      console.error('Error deleting scheduled report:', error);
      toast({
        title: 'Error deleting report',
        description: 'There was a problem deleting your scheduled report',
        variant: 'destructive'
      });
    }
  };
  
  // Run a scheduled report
  const runScheduledReport = async (id: string): Promise<void> => {
    try {
      // Run via API
      await analyticsService.runScheduledReport(id);
      
      toast({
        title: 'Report generated',
        description: 'Your scheduled report is being processed and will be sent to recipients',
      });
    } catch (error) {
      console.error('Error running scheduled report:', error);
      toast({
        title: 'Error running report',
        description: 'There was a problem running your scheduled report',
        variant: 'destructive'
      });
    }
  };

  // Create a new dashboard
  const createDashboard = async (dashboard: Partial<AnalyticsDashboard>): Promise<AnalyticsDashboard> => {
    try {
      // Convert internal layout structure to API format
      const apiLayout: WidgetLayout[] = (dashboard.layout?.widgets || []).map(widget => ({
        id: widget.id || uuidv4(),
        type: widget.type as WidgetType,
        title: widget.title,
        position: widget.position,
        dataSource: {
          type: widget.metricType,
          department: dashboard.departments?.[0] || user?.department,
          timeframe: 'QUARTERLY', // Default
          predictionId: widget.type === 'prediction' ? widget.dataSource : undefined
        },
        settings: {}
      }));
      
      // Create via API
      const newDashboard = await analyticsService.createDashboard({
        name: dashboard.name || 'New Dashboard',
        description: dashboard.description,
        layout: apiLayout,
        isDefault: dashboard.isDefault,
        departments: dashboard.departments || (user?.department ? [user.department] : [])
      });
      
      // Map to our format
      const mappedDashboard = mapApiDashboardToDashboard(newDashboard);
      
      // Update state
      setDashboards(prev => [mappedDashboard, ...prev]);
      
      return mappedDashboard;
    } catch (error) {
      console.error('Error creating dashboard:', error);
      toast({
        title: 'Error creating dashboard',
        description: 'There was a problem creating your dashboard',
        variant: 'destructive'
      });
      
      // Return empty dashboard to maintain flow
      return {
        _id: uuidv4(),
        name: dashboard.name || 'Failed Dashboard',
        description: dashboard.description || '',
        layout: dashboard.layout || { widgets: [] },
        createdBy: user?.id || '',
        isDefault: dashboard.isDefault || false,
        departments: dashboard.departments || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  };

  // Update a dashboard
  const updateDashboard = async (dashboard: AnalyticsDashboard): Promise<void> => {
    try {
      // Convert to API format
      const apiLayout: WidgetLayout[] = dashboard.layout.widgets.map(widget => ({
        id: widget.id,
        type: widget.type as WidgetType,
        title: widget.title,
        position: widget.position,
        dataSource: {
          type: widget.metricType,
          department: dashboard.departments?.[0] || user?.department,
          timeframe: 'QUARTERLY', // Default
          predictionId: widget.type === 'prediction' ? widget.dataSource : undefined
        },
        settings: {}
      }));
      
      // Update via API
      await analyticsService.updateDashboard(dashboard._id, {
        ...dashboard,
        layout: apiLayout
      });
      
      // Update state
      setDashboards(prev => 
        prev.map(d => d._id === dashboard._id ? dashboard : d)
      );
    } catch (error) {
      console.error('Error updating dashboard:', error);
      toast({
        title: 'Error updating dashboard',
        description: 'There was a problem updating your dashboard',
        variant: 'destructive'
      });
    }
  };

  // Delete a dashboard
  const deleteDashboard = async (id: string): Promise<void> => {
    try {
      // Delete via API
      await analyticsService.deleteDashboard(id);
      
      // Update state
      setDashboards(prev => prev.filter(d => d._id !== id));
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      toast({
        title: 'Error deleting dashboard',
        description: 'There was a problem deleting your dashboard',
        variant: 'destructive'
      });
    }
  };

  // Get workload prediction
  const getWorkloadPrediction = async (departmentId: string, timeframe: Timeframe): Promise<DataPoint[]> => {
    try {
      // Generate a new prediction for workload
      const prediction = await generatePrediction('WORKLOAD', timeframe, 'STATISTICAL', departmentId);
      return prediction.predicted;
    } catch (error) {
      console.error('Error getting workload prediction:', error);
      return [];
    }
  };

  // Get resource utilization prediction
  const getResourceUtilizationPrediction = async (departmentId: string, timeframe: Timeframe): Promise<DataPoint[]> => {
    try {
      // Generate a new prediction for efficiency
      const prediction = await generatePrediction('EFFICIENCY', timeframe, 'STATISTICAL', departmentId);
      return prediction.predicted;
    } catch (error) {
      console.error('Error getting resource utilization prediction:', error);
      return [];
    }
  };

  // Get optimal resource allocation
  const getOptimalResourceAllocation = async (departmentName: string): Promise<ResourceOptimization[]> => {
    try {
      // Find department ID from name
      const department = departments.find(d => d.name === departmentName);
      
      if (!department) {
        throw new Error(`Department ${departmentName} not found`);
      }
      
      // Get workload distribution from API
      const workloadData = await analyticsService.getWorkloadDistribution(department.id);
      
      // Calculate optimizations
      const totalMembers = workloadData.length;
      const totalTasks = workloadData.reduce((sum, item) => sum + item.taskCount, 0);
      const avgTaskCount = totalTasks / totalMembers;
      
      return workloadData.map(user => {
        const currentLoad = user.taskCount;
        const recommendedLoad = Math.round(avgTaskCount);
        const diff = currentLoad - recommendedLoad;
        const potentialGain = Math.abs(diff) / currentLoad * 100;
        
        return {
          memberId: user._id,
          memberName: user.name,
          currentLoad,
          recommendedLoad,
          potentialGain: Math.round(potentialGain * 10) / 10,
          reasonForChange: diff > 0 
            ? 'Overallocated - recommend reducing workload' 
            : diff < 0 
              ? 'Underutilized - can handle more tasks' 
              : 'Optimal allocation'
        };
      });
    } catch (error) {
      console.error('Error getting resource optimization:', error);
      return [];
    }
  };

  const getDashboardById = (id: string) => {
    return dashboards.find(d => d._id === id);
  };

  const getDefaultDashboard = () => {
    return dashboards.find(d => d.isDefault);
  };

  const getReportScheduleById = (id: string) => {
    return scheduledReports.find(r => r._id === id);
  };

  const getPredictionById = (id: string) => {
    return predictions.find(p => p._id === id);
  };

  const contextValue: PredictiveAnalyticsContextType = {
    predictions,
    reportSchedules: scheduledReports,
    scheduledReports,
    dashboards,
    isLoading,
    hasError,
    generatePrediction,
    createScheduledReport,
    updateScheduledReport,
    deleteScheduledReport,
    runScheduledReport,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    getWorkloadPrediction,
    getResourceUtilizationPrediction,
    getOptimalResourceAllocation,
    getDashboardById,
    getDefaultDashboard,
    getReportScheduleById,
    getPredictionById,
    refreshData
  };

  return (
    <PredictiveAnalyticsContext.Provider value={contextValue}>
      {children}
    </PredictiveAnalyticsContext.Provider>
  );
};

export const usePredictiveAnalytics = () => {
  const context = useContext(PredictiveAnalyticsContext);
  if (context === undefined) {
    throw new Error('usePredictiveAnalytics must be used within a PredictiveAnalyticsProvider');
  }
  return context;
}; 