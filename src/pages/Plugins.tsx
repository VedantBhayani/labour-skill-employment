import React, { useState, useEffect } from 'react';
import { usePlugins } from '../components/PluginProvider';
import { useAuth } from '../components/AuthProvider';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { PluginManifest, PluginType } from '../lib/plugins';
import { Trash2, Upload, Package, Settings, Info, AlertCircle, PlusCircle, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Avatar } from '../components/ui/avatar';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';

// Helper function to get icon for plugin type
const getPluginTypeIcon = (type: PluginType) => {
  switch (type) {
    case 'ui':
      return <div className="bg-blue-100 p-2 rounded-full"><Package className="h-5 w-5 text-blue-500" /></div>;
    case 'integration':
      return <div className="bg-purple-100 p-2 rounded-full"><Package className="h-5 w-5 text-purple-500" /></div>;
    case 'report':
      return <div className="bg-amber-100 p-2 rounded-full"><Package className="h-5 w-5 text-amber-500" /></div>;
    case 'dashboard':
      return <div className="bg-green-100 p-2 rounded-full"><Package className="h-5 w-5 text-green-500" /></div>;
    case 'workflow':
      return <div className="bg-pink-100 p-2 rounded-full"><Package className="h-5 w-5 text-pink-500" /></div>;
    case 'data-source':
      return <div className="bg-indigo-100 p-2 rounded-full"><Package className="h-5 w-5 text-indigo-500" /></div>;
    case 'custom':
    default:
      return <div className="bg-gray-100 p-2 rounded-full"><Package className="h-5 w-5 text-gray-500" /></div>;
  }
};

// Helper function to get badge styling for plugin type
const getPluginTypeBadge = (type: PluginType) => {
  switch (type) {
    case 'ui':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">UI</Badge>;
    case 'integration':
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Integration</Badge>;
    case 'report':
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Report</Badge>;
    case 'dashboard':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Dashboard</Badge>;
    case 'workflow':
      return <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">Workflow</Badge>;
    case 'data-source':
      return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Data Source</Badge>;
    case 'custom':
    default:
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Custom</Badge>;
  }
};

// Plugin Card Component
const PluginCard: React.FC<{ 
  manifest: PluginManifest; 
  enabled: boolean; 
  onToggle: () => void;
  onUninstall: () => void;
}> = ({ manifest, enabled, onToggle, onUninstall }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {getPluginTypeIcon(manifest.type)}
            <div>
              <CardTitle className="text-lg">{manifest.name}</CardTitle>
              <CardDescription className="text-xs">v{manifest.version} by {manifest.author}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getPluginTypeBadge(manifest.type)}
            <Switch 
              checked={enabled} 
              onCheckedChange={onToggle}
              aria-label={`${enabled ? 'Disable' : 'Enable'} ${manifest.name}`}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground">{manifest.description}</p>
      </CardContent>
      <CardFooter className="flex justify-between pt-2 border-t">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide Details' : 'View Details'}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onUninstall} 
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-1" /> Uninstall
        </Button>
      </CardFooter>
      
      {showDetails && (
        <div className="px-6 pb-6">
          <Accordion type="single" collapsible>
            <AccordionItem value="permissions">
              <AccordionTrigger className="text-sm">Required Permissions</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-1">
                  {manifest.requiredPermissions.map((perm) => (
                    <Badge key={perm} variant="secondary" className="text-xs">
                      {perm}
                    </Badge>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {manifest.dependencies && manifest.dependencies.length > 0 && (
              <AccordionItem value="dependencies">
                <AccordionTrigger className="text-sm">Dependencies</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc list-inside text-sm">
                    {manifest.dependencies.map((dep) => (
                      <li key={dep}>{dep}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}
            
            {manifest.optionalDependencies && manifest.optionalDependencies.length > 0 && (
              <AccordionItem value="optional">
                <AccordionTrigger className="text-sm">Optional Dependencies</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc list-inside text-sm">
                    {manifest.optionalDependencies.map((dep) => (
                      <li key={dep}>{dep}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}
            
            <AccordionItem value="technical">
              <AccordionTrigger className="text-sm">Technical Information</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Plugin ID:</span>
                    <span className="font-mono text-xs">{manifest.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Entry Point:</span>
                    <span className="font-mono text-xs">{manifest.entryPoint}</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </Card>
  );
};

// Upload Plugin Dialog
const UploadPluginDialog: React.FC<{
  onUpload: (manifest: PluginManifest) => void;
}> = ({ onUpload }) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'upload' | 'review' | 'installing'>('upload');
  const [manifest, setManifest] = useState<PluginManifest | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Mock function to simulate file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        // Mock manifest
        const mockManifest: PluginManifest = {
          id: "example-plugin",
          name: "Example Plugin",
          version: "1.0.0",
          description: "This is an example plugin uploaded from a file.",
          author: "Upload User",
          type: "custom",
          entryPoint: "index.js",
          requiredPermissions: ["read", "write"],
        };
        setManifest(mockManifest);
        setStep('review');
      }
    }, 200);
  };
  
  const handleInstall = () => {
    if (!manifest) return;
    
    setStep('installing');
    
    // Simulate installation
    setTimeout(() => {
      onUpload(manifest);
      setOpen(false);
      // Reset for next time
      setStep('upload');
      setManifest(null);
      setUploadProgress(0);
    }, 1500);
  };
  
  const handleCancel = () => {
    setOpen(false);
    // Reset for next time
    setTimeout(() => {
      setStep('upload');
      setManifest(null);
      setUploadProgress(0);
      setError(null);
    }, 300);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="h-4 w-4" /> Upload Plugin
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' && "Upload Plugin"}
            {step === 'review' && "Review Plugin"}
            {step === 'installing' && "Installing Plugin"}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && "Upload a plugin package to extend the application."}
            {step === 'review' && "Review plugin details before installation."}
            {step === 'installing' && "Installing the plugin, please wait..."}
          </DialogDescription>
        </DialogHeader>
        
        {step === 'upload' && (
          <>
            <div className="grid gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="plugin-file">Plugin Package</Label>
                <Input 
                  id="plugin-file" 
                  type="file" 
                  accept=".zip,.plugin"
                  onChange={handleFileUpload}
                />
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-center text-muted-foreground">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}
        
        {step === 'review' && manifest && (
          <>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{manifest.name}</h3>
                  <p className="text-sm text-muted-foreground">{manifest.description}</p>
                </div>
                {getPluginTypeBadge(manifest.type)}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Version:</span>
                  <span className="ml-2">{manifest.version}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Author:</span>
                  <span className="ml-2">{manifest.author}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">ID:</span>
                  <span className="ml-2 font-mono text-xs">{manifest.id}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Required Permissions:</h4>
                <div className="flex flex-wrap gap-1">
                  {manifest.requiredPermissions.map((perm) => (
                    <Badge key={perm} variant="secondary" className="text-xs">
                      {perm}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center p-3 border rounded-md bg-amber-50 text-amber-800">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <p className="text-sm">
                  Installing plugins from unknown sources may pose security risks. Only install plugins from trusted sources.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleInstall}>
                Install Plugin
              </Button>
            </DialogFooter>
          </>
        )}
        
        {step === 'installing' && (
          <div className="py-8 flex flex-col items-center justify-center">
            <div className="w-16 h-16 mb-4 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <p className="text-center text-muted-foreground">
              Installing plugin, please wait...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Plugin Marketplace Component
const PluginMarketplace: React.FC<{
  onInstall: (manifest: PluginManifest) => void;
}> = ({ onInstall }) => {
  // Mock marketplace plugins
  const marketplacePlugins: PluginManifest[] = [
    {
      id: "advanced-reports",
      name: "Advanced Reports",
      version: "2.1.0",
      description: "Adds advanced reporting capabilities with export to various formats.",
      author: "Report Solutions Inc.",
      type: "report",
      entryPoint: "index.js",
      requiredPermissions: ["read"],
    },
    {
      id: "dashboard-widgets",
      name: "Dashboard Widgets",
      version: "1.3.2",
      description: "Adds additional widgets to your dashboard for better data visualization.",
      author: "UI Experts",
      type: "dashboard",
      entryPoint: "index.js",
      requiredPermissions: ["read"],
    },
    {
      id: "workflow-automation",
      name: "Workflow Automation",
      version: "2.0.1",
      description: "Create automated workflows with triggers and actions.",
      author: "Automation Tools",
      type: "workflow",
      entryPoint: "index.js",
      requiredPermissions: ["read", "write"],
    },
    {
      id: "data-connector",
      name: "External Data Connector",
      version: "1.1.0",
      description: "Connect to external data sources and APIs.",
      author: "Integration Experts",
      type: "integration",
      entryPoint: "index.js",
      requiredPermissions: ["read", "write"],
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Plugin Marketplace</h2>
        <Input
          className="max-w-xs"
          placeholder="Search marketplace..."
          type="search"
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {marketplacePlugins.map((plugin) => (
          <Card key={plugin.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {getPluginTypeIcon(plugin.type)}
                  <div>
                    <CardTitle className="text-lg">{plugin.name}</CardTitle>
                    <CardDescription className="text-xs">v{plugin.version} by {plugin.author}</CardDescription>
                  </div>
                </div>
                {getPluginTypeBadge(plugin.type)}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">{plugin.description}</p>
            </CardContent>
            <CardFooter className="flex justify-end pt-2 border-t">
              <Button 
                onClick={() => onInstall(plugin)} 
                size="sm"
              >
                <PlusCircle className="h-4 w-4 mr-1" /> Install
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Plugin Settings Component
const PluginSettings: React.FC = () => {
  const [allowExternalInstall, setAllowExternalInstall] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [notifyUpdates, setNotifyUpdates] = useState(true);
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Plugin Settings</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="allow-external">Allow External Installations</Label>
            <p className="text-xs text-muted-foreground">
              Allow plugins to be installed from external sources
            </p>
          </div>
          <Switch 
            id="allow-external" 
            checked={allowExternalInstall} 
            onCheckedChange={setAllowExternalInstall}
          />
        </div>
        
        <Separator />
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-update">Auto-Update Plugins</Label>
            <p className="text-xs text-muted-foreground">
              Automatically update plugins when new versions are available
            </p>
          </div>
          <Switch 
            id="auto-update" 
            checked={autoUpdate} 
            onCheckedChange={setAutoUpdate}
          />
        </div>
        
        <Separator />
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notify-updates">Notify About Updates</Label>
            <p className="text-xs text-muted-foreground">
              Show notifications when plugin updates are available
            </p>
          </div>
          <Switch 
            id="notify-updates" 
            checked={notifyUpdates} 
            onCheckedChange={setNotifyUpdates}
          />
        </div>
      </div>
    </div>
  );
};

// Main Plugins Page Component
export const Plugins: React.FC = () => {
  const { plugins, enabledPlugins, enablePlugin, disablePlugin, uninstallPlugin, installPlugin } = usePlugins();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Check if user has admin privileges
  useEffect(() => {
    if (!user) return;
    
    if (user.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the plugins page.",
        variant: "destructive"
      });
      navigate('/', { replace: true });
    }
  }, [user, navigate, toast]);
  
  // If user doesn't have permission, don't render anything
  if (!user || user.role !== 'admin') {
    return null;
  }
  
  // Toggle plugin enabled state
  const handleTogglePlugin = (id: string, currentState: boolean) => {
    if (currentState) {
      disablePlugin(id);
    } else {
      enablePlugin(id);
    }
  };
  
  // Handle plugin installation from marketplace or upload
  const handleInstallPlugin = (manifest: PluginManifest) => {
    // Create a mock plugin instance
    const mockInstance = {
      onEnable: (api: any) => console.log("Plugin enabled:", manifest.id, api),
      onDisable: () => console.log("Plugin disabled:", manifest.id),
    };
    
    installPlugin(manifest, mockInstance);
    
    toast({
      title: "Plugin Installed",
      description: `Plugin ${manifest.name} has been installed successfully.`,
    });
  };
  
  // Handle plugin uninstallation
  const handleUninstallPlugin = (id: string) => {
    uninstallPlugin(id);
  };
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plugins</h1>
          <p className="text-muted-foreground">
            Manage and extend your application with plugins
          </p>
        </div>
        <UploadPluginDialog onUpload={handleInstallPlugin} />
      </div>
      
      <Tabs defaultValue="installed" className="space-y-6">
        <TabsList>
          <TabsTrigger value="installed">
            Installed ({plugins.length})
          </TabsTrigger>
          <TabsTrigger value="marketplace">
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="settings">
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="installed" className="space-y-6">
          {plugins.length === 0 ? (
            <Card className="p-8 flex flex-col items-center justify-center gap-4 text-center">
              <Package className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-xl font-semibold">No Plugins Installed</h3>
                <p className="text-muted-foreground">
                  Enhance your application by installing plugins from the marketplace
                </p>
              </div>
              <Button variant="outline" asChild>
                <TabsTrigger value="marketplace" className="mt-2">
                  Browse Marketplace
                </TabsTrigger>
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plugins.map((plugin) => (
                <PluginCard
                  key={plugin.manifest.id}
                  manifest={plugin.manifest}
                  enabled={plugin.enabled}
                  onToggle={() => handleTogglePlugin(plugin.manifest.id, plugin.enabled)}
                  onUninstall={() => handleUninstallPlugin(plugin.manifest.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="marketplace">
          <PluginMarketplace onInstall={handleInstallPlugin} />
        </TabsContent>
        
        <TabsContent value="settings">
          <PluginSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}; 