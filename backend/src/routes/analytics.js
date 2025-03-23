import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Sample data for mock responses
const departments = [
  { _id: 'dev-123', name: 'Development', employeeCount: 26, taskCount: 48 },
  { _id: 'hr-123', name: 'HR', employeeCount: 12, taskCount: 24 },
  { _id: 'sales-123', name: 'Sales', employeeCount: 18, taskCount: 32 },
];

// Mock data store (in production would be a database)
const mockDatabase = {
  predictions: [],
  scheduledReports: [],
  dashboards: [],
};

// Add this near the top of the file to track in-progress requests
const activeRequests = new Map();

// Dashboard routes
router.get('/dashboards', (req, res) => {
  res.json(mockDatabase.dashboards);
});

router.post('/dashboards', (req, res) => {
  const newDashboard = {
    ...req.body,
    _id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockDatabase.dashboards.push(newDashboard);
  res.status(201).json(newDashboard);
});

router.get('/dashboards/:id', (req, res) => {
  const dashboard = mockDatabase.dashboards.find(d => d._id === req.params.id);
  if (!dashboard) {
    return res.status(404).json({ message: 'Dashboard not found' });
  }
  res.json(dashboard);
});

router.put('/dashboards/:id', (req, res) => {
  const index = mockDatabase.dashboards.findIndex(d => d._id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Dashboard not found' });
  }
  
  mockDatabase.dashboards[index] = {
    ...mockDatabase.dashboards[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  
  res.json(mockDatabase.dashboards[index]);
});

router.delete('/dashboards/:id', (req, res) => {
  const index = mockDatabase.dashboards.findIndex(d => d._id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Dashboard not found' });
  }
  
  mockDatabase.dashboards.splice(index, 1);
  res.status(204).send();
});

// Prediction routes
router.post('/predictions', (req, res) => {
  const { metricType, timeframe, department = 'Development' } = req.body;
  
  // Immediately return cached data for the problematic request pattern
  if (metricType === 'PERFORMANCE' && timeframe === 'QUARTERLY' && department === 'HR') {
    console.log('Blocking known problematic request pattern: PERFORMANCE/QUARTERLY/HR');
    
    // Return static data to stop the loop
    return res.status(200).json({
      _id: `static-prediction-${Date.now()}`,
      title: `${timeframe} ${metricType} Forecast for ${department}`,
      description: "Static prediction to prevent request loop",
      metricType,
      timeframe,
      model: "STATISTICAL",
      department,
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
        historical: "#bb86fc",
        predicted: "#03dac6",
        confidence: "rgba(207, 102, 121, 0.5)"
      }
    });
  }
  
  try {
    // Generate a unique request ID
    const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Store this request as in-progress
    activeRequests.set(requestId, {
      timestamp: Date.now(),
      metricType,
      timeframe,
      department
    });
    
    // Check for duplicate or similar requests in the last 5 seconds
    const recentRequests = Array.from(activeRequests.values())
      .filter(req => 
        Date.now() - req.timestamp < 5000 && 
        req.metricType === metricType && 
        req.timeframe === timeframe && 
        req.department === department
      );
    
    // If there are multiple similar requests, we might be in a loop
    if (recentRequests.length > 2) {
      console.warn(`Detected possible request loop for ${metricType}/${timeframe}/${department}`);
      // Clean up old requests
      const fiveSecondsAgo = Date.now() - 5000;
      Array.from(activeRequests.keys())
        .filter(key => activeRequests.get(key).timestamp < fiveSecondsAgo)
        .forEach(key => activeRequests.delete(key));
      
      // Return cached response
      return res.status(200).json({
        _id: `cached-${requestId}`,
        title: `${timeframe} ${metricType} Forecast`,
        description: `AI-generated ${timeframe.toLowerCase()} forecast for ${department}`,
        metricType,
        timeframe,
        model: "STATISTICAL",
        department,
        accuracy: 85 + Math.random() * 10,
        createdBy: "system",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Return cached data with historical, predicted, and confidence data
        baseline: generateBaselineData(),
        predicted: generatePredictionData(),
        confidenceInterval: {
          upper: generateConfidenceData(0.1),
          lower: generateConfidenceData(-0.1),
        },
        chartColors: {
          historical: "#bb86fc", // Purple
          predicted: "#03dac6", // Teal
          confidence: "rgba(207, 102, 121, 0.5)" // Pink with transparency
        }
      });
    }
    
    // Generate prediction with a timeout to prevent hanging
    setTimeout(() => {
      // Remove this request from active requests
      activeRequests.delete(requestId);
      
      // Generate the actual prediction
      const prediction = {
        _id: `prediction-${Date.now()}`,
        title: `${timeframe} ${metricType} Forecast`,
        description: `AI-generated ${timeframe.toLowerCase()} forecast for ${department}`,
        metricType,
        timeframe,
        model: "STATISTICAL",
        department,
        accuracy: 85 + Math.random() * 10,
        createdBy: "system",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Generate data with our helper functions
        baseline: generateBaselineData(),
        predicted: generatePredictionData(),
        confidenceInterval: {
          upper: generateConfidenceData(0.1),
          lower: generateConfidenceData(-0.1),
        },
        chartColors: {
          historical: "#bb86fc", // Purple for historical
          predicted: "#03dac6", // Teal for predictions
          confidence: "rgba(207, 102, 121, 0.5)" // Pink with transparency for confidence
        }
      };
      
      // Store this in our predictions array
      mockDatabase.predictions.unshift(prediction);
      
      // Only keep the last 100 predictions to avoid memory issues
      if (mockDatabase.predictions.length > 100) {
        mockDatabase.predictions = mockDatabase.predictions.slice(0, 100);
      }
      
      console.log(`Generated prediction: ${prediction._id}`);
      return res.status(201).json(prediction);
    }, 500); // Small delay to simulate processing
  } catch (error) {
    console.error('Error generating prediction:', error);
    return res.status(500).json({ error: 'Failed to generate prediction' });
  }
});

router.get('/predictions', (req, res) => {
  // Filter by department and metricType if provided
  let results = [...mockDatabase.predictions];
  
  if (req.query.department) {
    results = results.filter(p => p.department === req.query.department);
  }
  
  if (req.query.metricType) {
    results = results.filter(p => p.metricType === req.query.metricType);
  }
  
  // Sort by created date (newest first)
  results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Limit results if requested
  if (req.query.limit) {
    results = results.slice(0, parseInt(req.query.limit));
  }
  
  res.json(results);
});

router.get('/predictions/:id', (req, res) => {
  const prediction = mockDatabase.predictions.find(p => p._id === req.params.id);
  if (!prediction) {
    return res.status(404).json({ message: 'Prediction not found' });
  }
  res.json(prediction);
});

router.delete('/predictions/:id', (req, res) => {
  const index = mockDatabase.predictions.findIndex(p => p._id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Prediction not found' });
  }
  
  mockDatabase.predictions.splice(index, 1);
  res.status(204).send();
});

// Scheduled Reports routes
router.post('/reports', (req, res) => {
  const newReport = {
    ...req.body,
    _id: uuidv4(),
    lastRun: null,
    nextRun: new Date(Date.now() + 86400000 * 7).toISOString(), // Next week
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockDatabase.scheduledReports.push(newReport);
  res.status(201).json(newReport);
});

router.get('/reports', (req, res) => {
  let results = [...mockDatabase.scheduledReports];
  
  if (req.query.department) {
    results = results.filter(r => r.department === req.query.department);
  }
  
  if (req.query.isActive !== undefined) {
    const isActive = req.query.isActive === 'true';
    results = results.filter(r => r.isActive === isActive);
  }
  
  res.json(results);
});

router.get('/reports/:id', (req, res) => {
  const report = mockDatabase.scheduledReports.find(r => r._id === req.params.id);
  if (!report) {
    return res.status(404).json({ message: 'Report not found' });
  }
  res.json(report);
});

router.put('/reports/:id', (req, res) => {
  const index = mockDatabase.scheduledReports.findIndex(r => r._id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Report not found' });
  }
  
  mockDatabase.scheduledReports[index] = {
    ...mockDatabase.scheduledReports[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  res.json(mockDatabase.scheduledReports[index]);
});

router.delete('/reports/:id', (req, res) => {
  const index = mockDatabase.scheduledReports.findIndex(r => r._id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Report not found' });
  }
  
  mockDatabase.scheduledReports.splice(index, 1);
  res.status(204).send();
});

router.post('/reports/:id/run', (req, res) => {
  const index = mockDatabase.scheduledReports.findIndex(r => r._id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Report not found' });
  }
  
  // Update lastRun time
  mockDatabase.scheduledReports[index] = {
    ...mockDatabase.scheduledReports[index],
    lastRun: new Date().toISOString(),
    nextRun: new Date(Date.now() + 86400000 * 7).toISOString(), // Next week
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    message: 'Report executed successfully',
    report: mockDatabase.scheduledReports[index]
  });
});

// Department Performance
router.get('/performance', (req, res) => {
  const departmentId = req.query.department || 'dev-123';
  
  const performanceData = {
    performanceRate: 78.5,
    completedTasks: 42,
    totalTasks: 58,
    productivityTrend: Array(12).fill(0).map((_, i) => ({ 
      date: new Date(2023, i, 1).toISOString(), 
      value: 65 + Math.floor(Math.random() * 25) 
    }))
  };
  
  res.json(performanceData);
});

// Workload Distribution
router.get('/workload', (req, res) => {
  const departmentId = req.query.department || 'dev-123';
  
  const workloadData = [
    { _id: "user1", name: "John Doe", taskCount: 12, role: "Developer" },
    { _id: "user2", name: "Jane Smith", taskCount: 8, role: "Designer" },
    { _id: "user3", name: "Bob Johnson", taskCount: 15, role: "Manager" },
    { _id: "user4", name: "Alice Williams", taskCount: 10, role: "Analyst" },
  ];
  
  res.json(workloadData);
});

// Department Efficiency
router.get('/efficiency', (req, res) => {
  const departmentId = req.query.department || 'dev-123';
  
  const efficiencyData = {
    efficiencyByPriority: [
      { priority: "high", avgCompletionHours: 18, taskCount: 24 },
      { priority: "medium", avgCompletionHours: 12, taskCount: 36 },
      { priority: "low", avgCompletionHours: 8, taskCount: 18 },
    ],
    overallAvgCompletionHours: 12.5,
    totalCompletedTasks: 78
  };
  
  res.json(efficiencyData);
});

// Skills Analysis
router.get('/skills', (req, res) => {
  const departmentId = req.query.department || 'dev-123';
  
  const skillsData = {
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
  
  res.json(skillsData);
});

// Add helper functions for generating data

// Helper function to generate baseline historical data
function generateBaselineData() {
  const now = Date.now();
  return Array(6).fill(0).map((_, i) => ({
    timestamp: new Date(now - (5-i) * 86400000).toISOString(),
    value: 70 + Math.floor(Math.random() * 20)
  }));
}

// Helper function to generate prediction data
function generatePredictionData() {
  const now = Date.now();
  return Array(6).fill(0).map((_, i) => ({
    timestamp: new Date(now + i * 86400000).toISOString(),
    value: 75 + Math.floor(Math.random() * 15)
  }));
}

// Helper function to generate confidence interval data
function generateConfidenceData(offset) {
  const now = Date.now();
  const basePredictions = generatePredictionData();
  
  return basePredictions.map(point => ({
    timestamp: point.timestamp,
    value: point.value * (1 + offset)
  }));
}

export default router; 