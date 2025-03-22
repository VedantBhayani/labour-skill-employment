/**
 * Plugin System
 * 
 * This module provides a plugin architecture for extending the application's functionality.
 * It allows third-party modules to be dynamically loaded and integrated.
 */

import React from 'react';

// Plugin types
export type PluginType = 
  | 'ui' 
  | 'integration' 
  | 'report' 
  | 'dashboard' 
  | 'workflow' 
  | 'data-source' 
  | 'custom';

// Plugin permission levels
export type PluginPermission = 'read' | 'write' | 'admin';

// Plugin manifest
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  type: PluginType;
  entryPoint: string;
  requiredPermissions: PluginPermission[];
  dependencies?: string[];
  optionalDependencies?: string[];
  icons?: {
    small?: string;
    medium?: string;
    large?: string;
  };
  settingsSchema?: any;
}

// Plugin API interface
export interface PluginAPI {
  // Core application access
  getAppVersion: () => string;
  getUser: () => any;
  getUserPermissions: () => string[];
  
  // UI extension
  registerComponent: (slot: string, component: React.ComponentType<any>, priority?: number) => string;
  unregisterComponent: (id: string) => boolean;
  registerRoute: (path: string, component: React.ComponentType<any>) => string;
  unregisterRoute: (id: string) => boolean;
  registerMenuItem: (location: string, item: MenuItem, priority?: number) => string;
  unregisterMenuItem: (id: string) => boolean;
  
  // Event system
  on: (event: string, callback: (...args: any[]) => void) => string;
  off: (id: string) => boolean;
  emit: (event: string, ...args: any[]) => void;
  
  // Data access
  getData: (entity: string, id?: string, options?: any) => Promise<any>;
  setData: (entity: string, data: any, id?: string) => Promise<any>;
  queryData: (entity: string, query: any) => Promise<any[]>;
  
  // Settings
  getSetting: (key: string) => any;
  setSetting: (key: string, value: any) => void;
  
  // Plugin utilities
  getPluginManifest: () => PluginManifest;
  getPluginStorage: () => Storage;
  registerDataProvider: (entity: string, provider: DataProvider) => void;
  unregisterDataProvider: (entity: string) => boolean;
  
  // Integration
  getIntegration: (name: string) => any;
}

// Menu item interface
export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<any> | string;
  onClick?: () => void;
  href?: string;
  children?: MenuItem[];
  requiredPermission?: PluginPermission;
}

// Data provider interface
export interface DataProvider {
  get: (id?: string, options?: any) => Promise<any>;
  list: (options?: any) => Promise<any[]>;
  create: (data: any) => Promise<any>;
  update: (id: string, data: any) => Promise<any>;
  delete: (id: string) => Promise<boolean>;
  query: (query: any) => Promise<any[]>;
}

// Plugin instance
export interface Plugin {
  manifest: PluginManifest;
  instance: any;
  enabled: boolean;
  api: PluginAPI;
}

/**
 * PluginManager class
 * 
 * Handles registration, loading, and lifecycle of plugins
 */
class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private componentRegistry: Map<string, {
    slot: string;
    component: React.ComponentType<any>;
    priority: number;
    pluginId: string;
  }> = new Map();
  private eventListeners: Map<string, {
    event: string;
    callback: (...args: any[]) => void;
    pluginId: string;
  }> = new Map();
  private routes: Map<string, {
    path: string;
    component: React.ComponentType<any>;
    pluginId: string;
  }> = new Map();
  private menuItems: Map<string, {
    location: string;
    item: MenuItem;
    priority: number;
    pluginId: string;
  }> = new Map();
  private dataProviders: Map<string, {
    entity: string;
    provider: DataProvider;
    pluginId: string;
  }> = new Map();
  
  // App integration callback
  private onPluginChange: (() => void) | null = null;
  
  // Register change listener
  registerChangeListener(callback: () => void) {
    this.onPluginChange = callback;
  }
  
  // Notify app of plugin changes
  private notifyChange() {
    if (this.onPluginChange) {
      this.onPluginChange();
    }
  }
  
  // Register a plugin
  registerPlugin(manifest: PluginManifest, instance: any): Plugin | null {
    // Check if plugin already exists
    if (this.plugins.has(manifest.id)) {
      console.error(`Plugin with id ${manifest.id} already registered`);
      return null;
    }
    
    // Create plugin API
    const api = this.createPluginAPI(manifest.id);
    
    // Create plugin
    const plugin: Plugin = {
      manifest,
      instance,
      enabled: false,
      api
    };
    
    // Store plugin
    this.plugins.set(manifest.id, plugin);
    
    // Notify app
    this.notifyChange();
    
    return plugin;
  }
  
  // Enable a plugin
  enablePlugin(id: string): boolean {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      console.error(`Plugin with id ${id} not found`);
      return false;
    }
    
    // Check dependencies
    if (plugin.manifest.dependencies) {
      for (const depId of plugin.manifest.dependencies) {
        const dep = this.plugins.get(depId);
        if (!dep || !dep.enabled) {
          console.error(`Required dependency ${depId} for plugin ${id} not enabled`);
          return false;
        }
      }
    }
    
    // Initialize plugin
    try {
      if (typeof plugin.instance.onEnable === 'function') {
        plugin.instance.onEnable(plugin.api);
      }
      
      plugin.enabled = true;
      
      // Notify app
      this.notifyChange();
      
      return true;
    } catch (error) {
      console.error(`Failed to enable plugin ${id}`, error);
      return false;
    }
  }
  
  // Disable a plugin
  disablePlugin(id: string): boolean {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      console.error(`Plugin with id ${id} not found`);
      return false;
    }
    
    // Check if other plugins depend on this one
    for (const [otherId, otherPlugin] of this.plugins.entries()) {
      if (otherPlugin.enabled && otherPlugin.manifest.dependencies?.includes(id)) {
        console.error(`Cannot disable plugin ${id} because plugin ${otherId} depends on it`);
        return false;
      }
    }
    
    // Clean up plugin resources
    this.cleanupPlugin(id);
    
    // Disable plugin
    try {
      if (typeof plugin.instance.onDisable === 'function') {
        plugin.instance.onDisable();
      }
      
      plugin.enabled = false;
      
      // Notify app
      this.notifyChange();
      
      return true;
    } catch (error) {
      console.error(`Failed to disable plugin ${id}`, error);
      return false;
    }
  }
  
  // Remove a plugin
  removePlugin(id: string): boolean {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      console.error(`Plugin with id ${id} not found`);
      return false;
    }
    
    // Disable first if enabled
    if (plugin.enabled) {
      const disabled = this.disablePlugin(id);
      if (!disabled) {
        return false;
      }
    }
    
    // Remove plugin
    this.plugins.delete(id);
    
    // Notify app
    this.notifyChange();
    
    return true;
  }
  
  // Clean up plugin resources
  private cleanupPlugin(id: string) {
    // Remove all components
    for (const [cId, comp] of this.componentRegistry.entries()) {
      if (comp.pluginId === id) {
        this.componentRegistry.delete(cId);
      }
    }
    
    // Remove all event listeners
    for (const [eId, listener] of this.eventListeners.entries()) {
      if (listener.pluginId === id) {
        this.eventListeners.delete(eId);
      }
    }
    
    // Remove all routes
    for (const [rId, route] of this.routes.entries()) {
      if (route.pluginId === id) {
        this.routes.delete(rId);
      }
    }
    
    // Remove all menu items
    for (const [mId, item] of this.menuItems.entries()) {
      if (item.pluginId === id) {
        this.menuItems.delete(mId);
      }
    }
    
    // Remove all data providers
    for (const [dpId, provider] of this.dataProviders.entries()) {
      if (provider.pluginId === id) {
        this.dataProviders.delete(dpId);
      }
    }
  }
  
  // Create plugin API
  private createPluginAPI(pluginId: string): PluginAPI {
    const generateId = () => `${pluginId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    return {
      // Core application access
      getAppVersion: () => '1.0.0', // Would be fetched from app config
      getUser: () => {
        // Would be fetched from auth context
        return {
          id: 'current-user',
          name: 'Current User',
          role: 'admin'
        };
      },
      getUserPermissions: () => ['read', 'write', 'admin'], // Would be fetched from auth context
      
      // UI extension
      registerComponent: (slot, component, priority = 10) => {
        const id = generateId();
        this.componentRegistry.set(id, {
          slot,
          component,
          priority,
          pluginId
        });
        this.notifyChange();
        return id;
      },
      unregisterComponent: (id) => {
        const result = this.componentRegistry.delete(id);
        if (result) this.notifyChange();
        return result;
      },
      registerRoute: (path, component) => {
        const id = generateId();
        this.routes.set(id, {
          path,
          component,
          pluginId
        });
        this.notifyChange();
        return id;
      },
      unregisterRoute: (id) => {
        const result = this.routes.delete(id);
        if (result) this.notifyChange();
        return result;
      },
      registerMenuItem: (location, item, priority = 10) => {
        const id = generateId();
        this.menuItems.set(id, {
          location,
          item,
          priority,
          pluginId
        });
        this.notifyChange();
        return id;
      },
      unregisterMenuItem: (id) => {
        const result = this.menuItems.delete(id);
        if (result) this.notifyChange();
        return result;
      },
      
      // Event system
      on: (event, callback) => {
        const id = generateId();
        this.eventListeners.set(id, {
          event,
          callback,
          pluginId
        });
        return id;
      },
      off: (id) => {
        return this.eventListeners.delete(id);
      },
      emit: (event, ...args) => {
        for (const [, listener] of this.eventListeners.entries()) {
          if (listener.event === event) {
            try {
              listener.callback(...args);
            } catch (error) {
              console.error(`Error in plugin ${listener.pluginId} event listener for ${event}`, error);
            }
          }
        }
      },
      
      // Data access
      getData: async (entity, id, options) => {
        const provider = this.dataProviders.get(entity);
        if (!provider) {
          throw new Error(`No data provider registered for entity ${entity}`);
        }
        return provider.provider.get(id, options);
      },
      setData: async (entity, data, id) => {
        const provider = this.dataProviders.get(entity);
        if (!provider) {
          throw new Error(`No data provider registered for entity ${entity}`);
        }
        if (id) {
          return provider.provider.update(id, data);
        } else {
          return provider.provider.create(data);
        }
      },
      queryData: async (entity, query) => {
        const provider = this.dataProviders.get(entity);
        if (!provider) {
          throw new Error(`No data provider registered for entity ${entity}`);
        }
        return provider.provider.query(query);
      },
      
      // Settings
      getSetting: (key) => {
        // Would be fetched from settings store
        const settingKey = `plugin.${pluginId}.${key}`;
        try {
          const value = localStorage.getItem(settingKey);
          return value ? JSON.parse(value) : null;
        } catch {
          return null;
        }
      },
      setSetting: (key, value) => {
        // Would be stored in settings store
        const settingKey = `plugin.${pluginId}.${key}`;
        localStorage.setItem(settingKey, JSON.stringify(value));
      },
      
      // Plugin utilities
      getPluginManifest: () => {
        const plugin = this.plugins.get(pluginId);
        return plugin ? plugin.manifest : null as any;
      },
      getPluginStorage: () => {
        // Create a localStorage-like interface scoped to this plugin
        return {
          getItem: (key: string) => {
            return localStorage.getItem(`plugin.${pluginId}.storage.${key}`);
          },
          setItem: (key: string, value: string) => {
            localStorage.setItem(`plugin.${pluginId}.storage.${key}`, value);
          },
          removeItem: (key: string) => {
            localStorage.removeItem(`plugin.${pluginId}.storage.${key}`);
          },
          clear: () => {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key?.startsWith(`plugin.${pluginId}.storage.`)) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key!));
          },
          key: (index: number) => {
            const keysForPlugin = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key?.startsWith(`plugin.${pluginId}.storage.`)) {
                keysForPlugin.push(key);
              }
            }
            return keysForPlugin[index] || null;
          },
          get length() {
            let count = 0;
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key?.startsWith(`plugin.${pluginId}.storage.`)) {
                count++;
              }
            }
            return count;
          }
        };
      },
      registerDataProvider: (entity, provider) => {
        const id = `${pluginId}.${entity}`;
        this.dataProviders.set(id, {
          entity,
          provider,
          pluginId
        });
      },
      unregisterDataProvider: (entity) => {
        const id = `${pluginId}.${entity}`;
        return this.dataProviders.delete(id);
      },
      
      // Integration
      getIntegration: (name) => {
        // This would fetch from an integrations registry
        return null;
      }
    };
  }
  
  // Get all registered plugins
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
  
  // Get a specific plugin
  getPlugin(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }
  
  // Get all components for a slot
  getComponentsForSlot(slot: string): React.ComponentType<any>[] {
    const components: { component: React.ComponentType<any>; priority: number }[] = [];
    
    for (const [, registration] of this.componentRegistry.entries()) {
      if (registration.slot === slot) {
        const plugin = this.plugins.get(registration.pluginId);
        if (plugin && plugin.enabled) {
          components.push({
            component: registration.component,
            priority: registration.priority
          });
        }
      }
    }
    
    // Sort by priority (higher first)
    components.sort((a, b) => b.priority - a.priority);
    
    return components.map(c => c.component);
  }
  
  // Get all registered routes
  getRoutes(): { path: string; component: React.ComponentType<any> }[] {
    const routes: { path: string; component: React.ComponentType<any> }[] = [];
    
    for (const [, registration] of this.routes.entries()) {
      const plugin = this.plugins.get(registration.pluginId);
      if (plugin && plugin.enabled) {
        routes.push({
          path: registration.path,
          component: registration.component
        });
      }
    }
    
    return routes;
  }
  
  // Get all menu items for a location
  getMenuItemsForLocation(location: string): MenuItem[] {
    const items: { item: MenuItem; priority: number }[] = [];
    
    for (const [, registration] of this.menuItems.entries()) {
      if (registration.location === location) {
        const plugin = this.plugins.get(registration.pluginId);
        if (plugin && plugin.enabled) {
          items.push({
            item: registration.item,
            priority: registration.priority
          });
        }
      }
    }
    
    // Sort by priority (higher first)
    items.sort((a, b) => b.priority - a.priority);
    
    return items.map(i => i.item);
  }
}

// Export singleton instance
export const pluginManager = new PluginManager(); 