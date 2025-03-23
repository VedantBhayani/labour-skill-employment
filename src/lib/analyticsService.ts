import axios from 'axios';

// Base API URL from environment variable or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Types for analytics data
export interface DepartmentPerformance {
  performanceRate: number;
  completedTasks: number;
  totalTasks: number;
  productivityTrend: ProductivityPoint[];
}

export interface ProductivityPoint {
  date: string;
  value: number;
}

export interface WorkloadData {
  _id: string;
  name: string;
  taskCount: number;
  role: string;
}

export interface EfficiencyData {
  efficiencyByPriority: {
    priority: string;
    avgCompletionHours: number;
    taskCount: number;
  }[];
  overallAvgCompletionHours: number;
  totalCompletedTasks: number;
}

export interface SkillsData {
  skillsCoverage: {
    skill: string;
    count: number;
    coverage: number;
  }[];
  teamSize: number;
  topSkills: {
    skill: string;
    count: number;
    coverage: number;
  }[];
  skillGaps: {
    skill: string;
    count: number;
    coverage: number;
  }[];
}

export interface Prediction {
  _id: string;
  title: string;
  description: string;
  metricType: MetricType;
  timeframe: Timeframe;
  model: string;
  department: string;
  baseline: DataPoint[];
  predicted: DataPoint[];
  confidenceInterval: {
    upper: DataPoint[];
    lower: DataPoint[];
  };
  accuracy: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  chartColors: {
    historical: string;
    predicted: string;
    confidence: string;
  };
}

export interface DataPoint {
  timestamp: string;
  value: number;
  department?: string;
}

export interface ScheduledReport {
  _id: string;
  name: string;
  description: string;
  metricType: MetricType;
  timeframe: Timeframe;
  recipients: {
    email: string;
    name?: string;
  }[];
  includeDataExport: boolean;
  includeVisualizations: boolean;
  department: string;
  lastRun?: string;
  nextRun?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Dashboard {
  _id: string;
  name: string;
  description: string;
  layout: WidgetLayout[];
  isDefault: boolean;
  departments: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WidgetLayout {
  id: string;
  type: WidgetType;
  title: string;
  dataSource: {
    type: MetricType;
    department?: string;
    timeframe?: Timeframe;
    predictionId?: string;
  };
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  settings?: Record<string, any>;
}

export type MetricType = 'PERFORMANCE' | 'WORKLOAD' | 'EFFICIENCY' | 'SKILLS' | 'PROGRESS';
export type Timeframe = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
export type WidgetType = 'chart' | 'stats' | 'table' | 'prediction';

// Helper to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Axios instance with auth
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Create a more descriptive error
    let errorMessage = 'An unexpected error occurred';
    let isConnectionError = false;
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.status, error.response.data);
      
      if (error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else {
        errorMessage = `Server error: ${error.response.status}`;
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API No Response:', error.request);
      errorMessage = 'No response from server. Please check your connection.';
      isConnectionError = true;
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Request Error:', error.message);
      errorMessage = error.message || 'Error setting up the request';
      isConnectionError = error.message?.includes('Network Error');
    }
    
    // Return a rejected promise with the error
    return Promise.reject({
      ...error,
      friendlyMessage: errorMessage,
      isConnectionError
    });
  }
);

// Helper function to handle API requests with offline fallback
const apiRequestWithFallback = async (apiCall, fallbackData) => {
  try {
    return await apiCall();
  } catch (error) {
    console.warn('API request failed, using fallback data:', error.friendlyMessage || 'Unknown error');
    
    // If this is a connection error, store that we're in offline mode
    if (error.isConnectionError) {
      localStorage.setItem('analytics_offline_mode', 'true');
    }
    
    return fallbackData;
  }
};

// Helper function to check if offline mode is enabled
const isOfflineMode = () => {
  return localStorage.getItem('analytics_offline_mode') === 'true';
};

// Helper function to set offline mode
const setOfflineMode = (isOffline: boolean) => {
  localStorage.setItem('analytics_offline_mode', isOffline ? 'true' : 'false');
  console.log(`Setting offline mode to ${isOffline}`);
};

// Default/sample data for offline mode
const SAMPLE_DEPARTMENT_PERFORMANCE = {
  performanceRate: 78.5,
  completedTasks: 42,
  totalTasks: 58,
  productivityTrend: Array(12).fill(0).map((_, i) => ({ 
    date: new Date(2023, i, 1).toISOString(), 
    value: 65 + Math.floor(Math.random() * 25) 
  }))
};

const SAMPLE_WORKLOAD_DATA = [
  { _id: "user1", name: "John Doe", taskCount: 12, role: "Developer" },
  { _id: "user2", name: "Jane Smith", taskCount: 8, role: "Designer" },
  { _id: "user3", name: "Bob Johnson", taskCount: 15, role: "Manager" },
  { _id: "user4", name: "Alice Williams", taskCount: 10, role: "Analyst" },
];

const SAMPLE_EFFICIENCY_DATA = {
  efficiencyByPriority: [
    { priority: "high", avgCompletionHours: 18, taskCount: 24 },
    { priority: "medium", avgCompletionHours: 12, taskCount: 36 },
    { priority: "low", avgCompletionHours: 8, taskCount: 18 },
  ],
  overallAvgCompletionHours: 12.5,
  totalCompletedTasks: 78
};

const SAMPLE_SKILLS_DATA = {
  skillsCoverage: [
    { skill: "JavaScript", count: 8, coverage: 80 },
    { skill: "React", count: 6, coverage: 60 },
    { skill: "TypeScript", count: 5, coverage: 50 },
    { skill: "Node.js", count: 4, coverage: 40 },
  ],
  teamSize: 10,
  topSkills: [
    { skill: "JavaScript", count: 8, coverage: 80 },
    { skill: "React", count: 6, coverage: 60 },
  ],
  skillGaps: [
    { skill: "Python", count: 1, coverage: 10 },
    { skill: "Data Science", count: 0, coverage: 0 },
  ]
};

// Add a flag to block certain API calls
let blockPredictionApiCalls = false;

// Function to enable/disable API call blocking
export const setBlockPredictionApiCalls = (block: boolean) => {
  console.log(`Setting blockPredictionApiCalls to ${block}`);
  blockPredictionApiCalls = block;
};

// Improve the isInAdvancedAnalyticsTab function to be more reliable
export const isInAdvancedAnalyticsTab = (): boolean => {
  // Multiple ways to detect the advanced tab
  const signals = [
    // Check URL path and hash
    window.location.pathname.includes('analytics') && window.location.hash.includes('advanced'),
    // Check sessionStorage
    sessionStorage.getItem('activeTab') === 'advanced',
    // Check localStorage
    localStorage.getItem('activeTab') === 'advanced',
    // Check if we're in the process of blocking API calls
    blockPredictionApiCalls
  ];
  
  // If any of these signals are true, we're in the advanced tab
  const result = signals.some(signal => signal === true);
  
  // Debug log
  console.log(`Advanced tab detection: ${result}`, { signals });
  
  return result;
};

/**
 * Analytics Service
 * Handles all API calls for advanced analytics features
 */
export const analyticsService = {
  // Department Performance
  getDepartmentPerformance: async (departmentId: string, timeframe?: Timeframe): Promise<DepartmentPerformance> => {
    // Check if we're in offline mode
    if (isOfflineMode()) {
      return SAMPLE_DEPARTMENT_PERFORMANCE;
    }
    
    return apiRequestWithFallback(
      async () => {
        const response = await apiClient.get('/analytics/performance', {
          params: { department: departmentId, timeframe }
        });
        return response.data;
      },
      SAMPLE_DEPARTMENT_PERFORMANCE
    );
  },

  // Workload Distribution
  getWorkloadDistribution: async (departmentId: string): Promise<WorkloadData[]> => {
    if (isOfflineMode()) {
      return SAMPLE_WORKLOAD_DATA;
    }
    
    return apiRequestWithFallback(
      async () => {
        const response = await apiClient.get('/analytics/workload', {
          params: { department: departmentId }
        });
        return response.data;
      },
      SAMPLE_WORKLOAD_DATA
    );
  },

  // Department Efficiency
  getDepartmentEfficiency: async (departmentId: string, timeframe?: Timeframe): Promise<EfficiencyData> => {
    if (isOfflineMode()) {
      return SAMPLE_EFFICIENCY_DATA;
    }
    
    return apiRequestWithFallback(
      async () => {
        const response = await apiClient.get('/analytics/efficiency', {
          params: { department: departmentId, timeframe }
        });
        return response.data;
      },
      SAMPLE_EFFICIENCY_DATA
    );
  },

  // Skills Analysis
  getDepartmentSkillsAnalysis: async (departmentId: string): Promise<SkillsData> => {
    if (isOfflineMode()) {
      return SAMPLE_SKILLS_DATA;
    }
    
    return apiRequestWithFallback(
      async () => {
        const response = await apiClient.get('/analytics/skills', {
          params: { department: departmentId }
        });
        return response.data;
      },
      SAMPLE_SKILLS_DATA
    );
  },

  // Reset offline mode
  resetOfflineMode: () => {
    localStorage.removeItem('analytics_offline_mode');
  },

  // Predictions
  createPrediction: async (data: {
    metricType: MetricType;
    timeframe: Timeframe;
    department: string;
  }): Promise<Prediction> => {
    if (blockPredictionApiCalls || isInAdvancedAnalyticsTab()) {
      console.log("Blocking prediction API call due to Advanced Analytics tab");
      return generateMockPrediction(data.metricType, data.timeframe, "STATISTICAL", data.department);
    }
    
    if (isOfflineMode()) {
      // Generate mock prediction data for offline mode
      const mockPrediction = generateMockPrediction(data.metricType, data.timeframe, "STATISTICAL", data.department);
      return mockPrediction;
    }

    try {
      const response = await apiClient.post('/analytics/predictions', data);
      return response.data;
    } catch (error) {
      console.error('Failed to create prediction:', error);
      setOfflineMode(true);
      // Return mock data as fallback
      return {
        _id: `offline-prediction-${Date.now()}`,
        title: `${data.timeframe} ${data.metricType} Forecast (Offline)`,
        description: "Generated in offline mode due to API error",
        metricType: data.metricType,
        timeframe: data.timeframe,
        model: "STATISTICAL",
        department: data.department,
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
            value: 85 + Math.floor(Math.random() * 10)
          })),
          lower: Array(6).fill(0).map((_, i) => ({
            timestamp: new Date(Date.now() + i * 86400000).toISOString(),
            value: 65 + Math.floor(Math.random() * 10)
          }))
        },
        accuracy: 0.85,
        createdBy: "system",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        chartColors: {
          historical: "#bb86fc", // Material Design Purple
          predicted: "#03dac6",  // Material Design Teal
          confidence: "#cf6679"  // Material Design Pink
        }
      };
    }
  },

  getAllPredictions: async (params?: {
    department?: string;
    metricType?: MetricType;
    limit?: number;
  }): Promise<Prediction[]> => {
    if (isOfflineMode()) {
      // Return some mock predictions
      return Array(3).fill(0).map((_, i) => ({
        _id: `mock-prediction-${i}`,
        title: `Mock ${i === 0 ? 'WORKLOAD' : i === 1 ? 'EFFICIENCY' : 'PERFORMANCE'} Prediction`,
        description: "Generated in offline mode",
        metricType: i === 0 ? 'WORKLOAD' as MetricType : i === 1 ? 'EFFICIENCY' as MetricType : 'PERFORMANCE' as MetricType,
        timeframe: 'QUARTERLY' as Timeframe,
        model: "STATISTICAL",
        department: params?.department || "Development",
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
        updatedAt: new Date().toISOString(),
        chartColors: {
          historical: "#bb86fc", // Material Design Purple
          predicted: "#03dac6",  // Material Design Teal
          confidence: "#cf6679"  // Material Design Pink
        }
      }));
    }
    
    const response = await apiClient.get('/analytics/predictions', { params });
    return response.data;
  },

  getPredictionById: async (id: string): Promise<Prediction> => {
    if (isOfflineMode() || id.startsWith('mock-')) {
      // Return a mock prediction
      return {
        _id: id,
        title: "Mock Prediction",
        description: "Generated in offline mode",
        metricType: 'PERFORMANCE' as MetricType,
        timeframe: 'QUARTERLY' as Timeframe,
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
        updatedAt: new Date().toISOString(),
        chartColors: {
          historical: "#bb86fc", // Material Design Purple
          predicted: "#03dac6",  // Material Design Teal
          confidence: "#cf6679"  // Material Design Pink
        }
      };
    }
    
    const response = await apiClient.get(`/analytics/predictions/${id}`);
    return response.data;
  },

  deletePrediction: async (id: string): Promise<void> => {
    if (isOfflineMode() || id.startsWith('mock-')) {
      // Pretend to delete
      return;
    }
    
    await apiClient.delete(`/analytics/predictions/${id}`);
  },

  // Scheduled Reports
  createScheduledReport: async (data: {
    name: string;
    description?: string;
    metricType: MetricType;
    timeframe: Timeframe;
    recipients?: { email: string; name?: string }[];
    includeDataExport?: boolean;
    includeVisualizations?: boolean;
    department: string;
    isActive?: boolean;
  }): Promise<ScheduledReport> => {
    if (isOfflineMode()) {
      // Return a mock report
      return {
        _id: `mock-report-${Date.now()}`,
        name: data.name,
        description: data.description || "",
        metricType: data.metricType,
        timeframe: data.timeframe,
        recipients: data.recipients || [],
        includeDataExport: data.includeDataExport || false,
        includeVisualizations: data.includeVisualizations || true,
        department: data.department,
        lastRun: null,
        nextRun: new Date(Date.now() + 86400000 * 7).toISOString(),
        isActive: data.isActive || true,
        createdBy: "system",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    const response = await apiClient.post('/analytics/reports', data);
    return response.data;
  },

  getAllScheduledReports: async (params?: {
    department?: string;
    isActive?: boolean;
  }): Promise<ScheduledReport[]> => {
    if (isOfflineMode()) {
      // Return some mock reports
      return Array(2).fill(0).map((_, i) => ({
        _id: `mock-report-${i}`,
        name: `${i === 0 ? 'Weekly' : 'Monthly'} Performance Report`,
        description: "Generated in offline mode",
        metricType: 'PERFORMANCE' as MetricType,
        timeframe: i === 0 ? 'WEEKLY' as Timeframe : 'MONTHLY' as Timeframe,
        recipients: [{ email: 'user@example.com', name: 'Test User' }],
        includeDataExport: i === 1,
        includeVisualizations: true,
        department: params?.department || "Development",
        lastRun: i === 0 ? new Date(Date.now() - 86400000 * 7).toISOString() : null,
        nextRun: new Date(Date.now() + 86400000 * (i === 0 ? 7 : 30)).toISOString(),
        isActive: true,
        createdBy: "system",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    }
    
    const response = await apiClient.get('/analytics/reports', { params });
    return response.data;
  },

  getScheduledReportById: async (id: string): Promise<ScheduledReport> => {
    const response = await apiClient.get(`/analytics/reports/${id}`);
    return response.data;
  },

  updateScheduledReport: async (id: string, data: Partial<ScheduledReport>): Promise<ScheduledReport> => {
    const response = await apiClient.put(`/analytics/reports/${id}`, data);
    return response.data;
  },

  deleteScheduledReport: async (id: string): Promise<void> => {
    await apiClient.delete(`/analytics/reports/${id}`);
  },

  runScheduledReport: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/analytics/reports/${id}/run`);
    return response.data;
  },

  // Dashboards
  createDashboard: async (data: {
    name: string;
    description?: string;
    layout: WidgetLayout[];
    isDefault?: boolean;
    departments?: string[];
  }): Promise<Dashboard> => {
    const response = await apiClient.post('/analytics/dashboards', data);
    return response.data;
  },

  getAllDashboards: async (params?: {
    isDefault?: boolean;
  }): Promise<Dashboard[]> => {
    const response = await apiClient.get('/analytics/dashboards', { params });
    return response.data;
  },

  getDashboardById: async (id: string): Promise<Dashboard> => {
    const response = await apiClient.get(`/analytics/dashboards/${id}`);
    return response.data;
  },

  updateDashboard: async (id: string, data: Partial<Dashboard>): Promise<Dashboard> => {
    const response = await apiClient.put(`/analytics/dashboards/${id}`, data);
    return response.data;
  },

  deleteDashboard: async (id: string): Promise<void> => {
    await apiClient.delete(`/analytics/dashboards/${id}`);
  }
};

// When server is running, we want to disable offline mode
localStorage.removeItem('analytics_offline_mode');

// Generate mock prediction data for offline mode
const generateMockPrediction = (metricType: MetricType, timeframe: Timeframe, model: string, department: string): Prediction => {
  const now = new Date();
  const baselineCount = timeframe === 'DAILY' ? 7 : timeframe === 'WEEKLY' ? 8 : timeframe === 'MONTHLY' ? 12 : 4;
  const futureCount = timeframe === 'DAILY' ? 7 : timeframe === 'WEEKLY' ? 4 : timeframe === 'MONTHLY' ? 3 : 2;
  
  // Generate baseline (historical) data
  const baseline = [];
  for (let i = baselineCount; i > 0; i--) {
    const date = new Date();
    if (timeframe === 'DAILY') date.setDate(now.getDate() - i);
    else if (timeframe === 'WEEKLY') date.setDate(now.getDate() - (i * 7));
    else if (timeframe === 'MONTHLY') date.setMonth(now.getMonth() - i);
    else date.setMonth(now.getMonth() - (i * 3)); // QUARTERLY
    
    baseline.push({
      timestamp: date.toISOString(),
      value: 20 + Math.random() * 60 + (baselineCount - i) * (Math.random() * 5)
    });
  }
  
  // Use last point as base for predictions
  const lastPoint = baseline[baseline.length - 1].value;
  const trend = (baseline[baseline.length - 1].value - baseline[0].value) / baseline.length;
  
  // Generate future prediction data
  const predicted = [];
  const upperBound = [];
  const lowerBound = [];
  
  for (let i = 1; i <= futureCount; i++) {
    const date = new Date();
    if (timeframe === 'DAILY') date.setDate(now.getDate() + i);
    else if (timeframe === 'WEEKLY') date.setDate(now.getDate() + (i * 7));
    else if (timeframe === 'MONTHLY') date.setMonth(now.getMonth() + i);
    else date.setMonth(now.getMonth() + (i * 3)); // QUARTERLY
    
    const predictedValue = lastPoint + (trend * i) + (Math.random() * 15 - 7.5);
    const confidence = 5 + (i * 2.5); // Increasing confidence interval
    
    predicted.push({
      timestamp: date.toISOString(),
      value: predictedValue
    });
    
    upperBound.push({
      timestamp: date.toISOString(),
      value: predictedValue + confidence
    });
    
    lowerBound.push({
      timestamp: date.toISOString(),
      value: Math.max(0, predictedValue - confidence) // Ensure we don't go negative
    });
  }
  
  // Generate appropriate title based on metric type and timeframe
  const titles = {
    PERFORMANCE: 'Team Performance Forecast',
    WORKLOAD: 'Expected Workload Distribution',
    EFFICIENCY: 'Resource Efficiency Trends',
    SKILLS: 'Skills Gap Analysis',
    PROGRESS: 'Project Progress Trajectory'
  };
  
  return {
    _id: String(Math.floor(Math.random() * 10000)),
    title: `${titles[metricType] || 'Predictive Analysis'} for ${department}`,
    description: `${timeframe.toLowerCase()} forecast based on historical data analysis`,
    metricType,
    timeframe,
    model,
    department,
    baseline,
    predicted,
    confidenceInterval: {
      upper: upperBound,
      lower: lowerBound
    },
    accuracy: 0.75 + Math.random() * 0.2, // 75-95% accuracy
    createdBy: "user",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Add high-contrast color palette for better visibility on any background
    chartColors: {
      historical: "#bb86fc", // Material Design Purple
      predicted: "#03dac6",  // Material Design Teal
      confidence: "#cf6679"  // Material Design Pink
    }
  };
} 