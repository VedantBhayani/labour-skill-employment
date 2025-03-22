import React from 'react';
import { PluginAPI, PluginManifest } from '../lib/plugins';

// Sample Dashboard Widget Component
const SampleDashboardWidget: React.FC = () => {
  return (
    <div className="p-4 border rounded-lg bg-white shadow">
      <h3 className="font-medium mb-2">Sample Plugin Widget</h3>
      <p className="text-sm text-gray-500">This widget is provided by the sample plugin.</p>
      <div className="mt-2 text-xs bg-blue-50 p-2 rounded">
        Plugin widgets can display data, charts, or interactive elements.
      </div>
    </div>
  );
};

// Define the plugin manifest
export const samplePluginManifest: PluginManifest = {
  id: "sample-plugin",
  name: "Sample Plugin",
  version: "1.0.0",
  description: "A sample plugin to demonstrate the plugin system capabilities.",
  author: "Your Company",
  type: "dashboard",
  entryPoint: "index.js",
  requiredPermissions: ["read"],
};

// The plugin instance with lifecycle methods
export const samplePluginInstance = {
  // Called when the plugin is enabled
  onEnable: (api: PluginAPI) => {
    console.log("Sample plugin enabled!");
    
    // Register a component for the dashboard
    api.registerComponent('dashboard.widgets', SampleDashboardWidget, 10);
    
    // Register a menu item
    api.registerMenuItem('settings.menu', {
      id: 'sample-plugin-settings',
      label: 'Sample Plugin Settings',
      onClick: () => console.log('Sample plugin settings clicked'),
      requiredPermission: 'read',
    });
    
    // Subscribe to some events
    api.on('user.login', (userData) => {
      console.log('User logged in:', userData);
    });
    
    // Store some settings
    api.setSetting('lastEnabled', new Date().toISOString());
  },
  
  // Called when the plugin is disabled
  onDisable: () => {
    console.log("Sample plugin disabled!");
  }
}; 