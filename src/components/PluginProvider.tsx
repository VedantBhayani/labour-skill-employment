import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { pluginManager, Plugin, PluginType, PluginManifest } from '../lib/plugins';
import { useToast } from '../hooks/use-toast';
import { initialPlugins } from '../plugins';

// Plugin context type definition
interface PluginContextType {
  // Plugin management
  plugins: Plugin[];
  enabledPlugins: Plugin[];
  enablePlugin: (id: string) => boolean;
  disablePlugin: (id: string) => boolean;
  installPlugin: (manifest: PluginManifest, instance: any) => Plugin | null;
  uninstallPlugin: (id: string) => boolean;
  
  // Plugin UI extensions
  getComponentsForSlot: (slot: string) => React.ComponentType<any>[];
  getMenuItemsForLocation: (location: string) => any[];
  getPluginRoutes: () => { path: string; component: React.ComponentType<any> }[];
  
  // Plugin utilities
  isPluginEnabled: (id: string) => boolean;
  getPluginsByType: (type: PluginType) => Plugin[];
  refreshPlugins: () => void;
}

// Create context with default values
const PluginContext = createContext<PluginContextType>({
  plugins: [],
  enabledPlugins: [],
  enablePlugin: () => false,
  disablePlugin: () => false,
  installPlugin: () => null,
  uninstallPlugin: () => false,
  getComponentsForSlot: () => [],
  getMenuItemsForLocation: () => [],
  getPluginRoutes: () => [],
  isPluginEnabled: () => false,
  getPluginsByType: () => [],
  refreshPlugins: () => {}
});

// Hook for accessing plugin context
export const usePlugins = () => useContext(PluginContext);

// Props for the PluginProvider
interface PluginProviderProps {
  children: ReactNode;
  initialPlugins?: Array<{
    manifest: PluginManifest;
    instance: any;
    autoEnable?: boolean;
  }>;
}

// Plugin Provider component
export const PluginProvider: React.FC<PluginProviderProps> = ({
  children,
  initialPlugins: customInitialPlugins = []
}) => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const { toast } = useToast();

  // Initialize plugin manager and register change handler
  useEffect(() => {
    // Register for plugin changes
    pluginManager.registerChangeListener(() => {
      // Update state when plugins change
      setPlugins([...pluginManager.getPlugins()]);
    });
    
    // Register custom initial plugins
    for (const { manifest, instance, autoEnable } of customInitialPlugins) {
      const plugin = pluginManager.registerPlugin(manifest, instance);
      if (plugin && autoEnable) {
        pluginManager.enablePlugin(manifest.id);
      }
    }
    
    // Register our bundled plugins
    for (const { manifest, instance, autoEnable } of initialPlugins) {
      const plugin = pluginManager.registerPlugin(manifest, instance);
      if (plugin && autoEnable) {
        console.log(`Auto-enabling plugin: ${manifest.id}`);
        pluginManager.enablePlugin(manifest.id);
      }
    }
    
    // Initial plugin state
    setPlugins([...pluginManager.getPlugins()]);
    
  }, [customInitialPlugins]);

  // Get list of enabled plugins
  const enabledPlugins = plugins.filter(plugin => plugin.enabled);
  
  // Enable a plugin
  const enablePlugin = (id: string): boolean => {
    const success = pluginManager.enablePlugin(id);
    if (success) {
      toast({
        title: "Plugin Enabled",
        description: `Plugin ${id} has been enabled successfully.`,
      });
    } else {
      toast({
        title: "Plugin Error",
        description: `Failed to enable plugin ${id}.`,
        variant: "destructive",
      });
    }
    return success;
  };
  
  // Disable a plugin
  const disablePlugin = (id: string): boolean => {
    const success = pluginManager.disablePlugin(id);
    if (success) {
      toast({
        title: "Plugin Disabled",
        description: `Plugin ${id} has been disabled.`,
      });
    } else {
      toast({
        title: "Plugin Error",
        description: `Failed to disable plugin ${id}.`,
        variant: "destructive",
      });
    }
    return success;
  };
  
  // Install a new plugin
  const installPlugin = (manifest: PluginManifest, instance: any): Plugin | null => {
    const plugin = pluginManager.registerPlugin(manifest, instance);
    if (plugin) {
      toast({
        title: "Plugin Installed",
        description: `Plugin ${manifest.name} (${manifest.id}) has been installed.`,
      });
    } else {
      toast({
        title: "Installation Error",
        description: `Failed to install plugin ${manifest.name} (${manifest.id}).`,
        variant: "destructive",
      });
    }
    return plugin;
  };
  
  // Uninstall a plugin
  const uninstallPlugin = (id: string): boolean => {
    const plugin = pluginManager.getPlugin(id);
    const success = pluginManager.removePlugin(id);
    if (success && plugin) {
      toast({
        title: "Plugin Uninstalled",
        description: `Plugin ${plugin.manifest.name} (${id}) has been uninstalled.`,
      });
    } else {
      toast({
        title: "Uninstallation Error",
        description: `Failed to uninstall plugin ${id}.`,
        variant: "destructive",
      });
    }
    return success;
  };
  
  // Get all components for a specific slot
  const getComponentsForSlot = (slot: string): React.ComponentType<any>[] => {
    return pluginManager.getComponentsForSlot(slot);
  };
  
  // Get all menu items for a specific location
  const getMenuItemsForLocation = (location: string): any[] => {
    return pluginManager.getMenuItemsForLocation(location);
  };
  
  // Get all routes from plugins
  const getPluginRoutes = () => {
    return pluginManager.getRoutes();
  };
  
  // Check if a plugin is enabled
  const isPluginEnabled = (id: string): boolean => {
    const plugin = pluginManager.getPlugin(id);
    return plugin ? plugin.enabled : false;
  };
  
  // Get plugins filtered by type
  const getPluginsByType = (type: PluginType): Plugin[] => {
    return plugins.filter(plugin => plugin.manifest.type === type);
  };
  
  // Force refresh plugins state
  const refreshPlugins = () => {
    setPlugins([...pluginManager.getPlugins()]);
  };
  
  // Context value
  const value: PluginContextType = {
    plugins,
    enabledPlugins,
    enablePlugin,
    disablePlugin,
    installPlugin,
    uninstallPlugin,
    getComponentsForSlot,
    getMenuItemsForLocation,
    getPluginRoutes,
    isPluginEnabled,
    getPluginsByType,
    refreshPlugins,
  };
  
  return (
    <PluginContext.Provider value={value}>
      {children}
    </PluginContext.Provider>
  );
}; 