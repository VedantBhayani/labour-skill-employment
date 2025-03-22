import { samplePluginManifest, samplePluginInstance } from './SamplePlugin';

// Export plugin manifests and instances
export const pluginManifests = [
  samplePluginManifest,
];

export const pluginInstances = [
  samplePluginInstance,
];

// Export an array of plugin configurations
export const initialPlugins = [
  {
    manifest: samplePluginManifest,
    instance: samplePluginInstance,
    autoEnable: true, // Auto-enable this plugin
  }
];