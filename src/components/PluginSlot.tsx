import React from 'react';
import { usePlugins } from './PluginProvider';

interface PluginSlotProps {
  name: string;
  fallback?: React.ReactNode;
  props?: Record<string, any>;
}

/**
 * PluginSlot component
 * Renders all plugin components registered for a specific slot
 */
export const PluginSlot: React.FC<PluginSlotProps> = ({
  name,
  fallback = null,
  props = {}
}) => {
  const { getComponentsForSlot } = usePlugins();
  const components = getComponentsForSlot(name);
  
  if (components.length === 0) {
    return <>{fallback}</>;
  }
  
  return (
    <>
      {components.map((Component, index) => (
        <div key={`plugin-${name}-${index}`} className="plugin-component">
          <Component {...props} />
        </div>
      ))}
    </>
  );
};

/**
 * PluginMenuItem component
 * Renders all plugin menu items registered for a specific location
 */
interface PluginMenuItemsProps {
  location: string;
  renderItem: (item: any, index: number) => React.ReactNode;
  fallback?: React.ReactNode;
}

export const PluginMenuItems: React.FC<PluginMenuItemsProps> = ({
  location,
  renderItem,
  fallback = null
}) => {
  const { getMenuItemsForLocation } = usePlugins();
  const menuItems = getMenuItemsForLocation(location);
  
  if (menuItems.length === 0) {
    return <>{fallback}</>;
  }
  
  return (
    <>
      {menuItems.map((item, index) => renderItem(item, index))}
    </>
  );
}; 