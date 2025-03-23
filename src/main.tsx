import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { realTimeService } from './lib/realTimeService';
import { websocketService } from './lib/websocketService';

// Flag to track if real-time services have been initialized
let realTimeServicesInitialized = false;

// Initialize real-time services only once
function initializeRealTimeServices() {
  // Skip if already initialized
  if (realTimeServicesInitialized) {
    console.log('Real-time services already initialized, skipping...');
    return;
  }
  
  // Set the flag to prevent multiple initializations
  realTimeServicesInitialized = true;
  
  // Get user ID from localStorage or use a default
  const userId = localStorage.getItem('userId') || 'admin';
  const authToken = localStorage.getItem('authToken') || 'dummy-token';
  
  // Initialize the real-time service
  realTimeService.initialize({
    userId,
    authToken,
    onConnectionStatusChange: (status) => {
      console.log('Connection status changed:', status);
    },
    onUserStatusChange: (userId, status) => {
      console.log(`User ${userId} is now ${status}`);
    },
    onNotificationReceived: (notification) => {
      console.log('Notification received:', notification);
    },
    onMessageReceived: (message) => {
      console.log('Message received:', message);
    }
  }).catch(err => {
    console.error('Failed to initialize real-time services:', err);
  });
  
  // Set user status to online
  if (userId) {
    websocketService.send('USER_STATUS', { 
      status: 'online'
    });
  }
  
  // Update status to offline before unloading the page
  window.addEventListener('beforeunload', () => {
    if (userId) {
      websocketService.send('USER_STATUS', { 
        status: 'offline'
      });
      realTimeService.dispose();
    }
  });
}

// Call the initialization function
// Comment out for testing or enable with conditional
// initializeRealTimeServices();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
