import React, { useState, useRef, ReactNode } from "react";
import { 
  Grip, 
  Settings, 
  X, 
  Plus, 
  LineChart, 
  BarChart, 
  PieChart, 
  SquareStack, 
  Save, 
  Download, 
  RotateCcw,
  Trash,
  AlertCircle
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { useDepartments } from "@/components/DepartmentsProvider";
import { AnalyticsDashboard, MetricType, usePredictiveAnalytics } from "@/components/PredictiveAnalyticsProvider";
import { PredictiveChart } from './PredictiveChart';
import { v4 as uuidv4 } from 'uuid';

// Define widget types that match usage in this component
type WidgetType = 'chart' | 'statistics' | 'table' | 'prediction';
type WidgetSize = 'small' | 'medium' | 'large';

// Custom dashboard layout type that matches this component's usage
interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  dataSource: string;
  metricType: MetricType;
  size: WidgetSize;
  position: {
    x: number;
    y: number;
    w?: number;
    h?: number;
  };
  config?: any;
}

// Override the imported DashboardLayout with our local version
interface DashboardLayout {
  widgets: DashboardWidget[];
}

interface DashboardWidgetProps {
  layout: DashboardWidget;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  children?: ReactNode;
}

// Widget component
const DashboardWidget = ({ layout, onEdit, onRemove, children }: DashboardWidgetProps) => {
  // Determine size classes based on widget size
  const sizeClasses = {
    small: "col-span-1 row-span-1",
    medium: "col-span-2 row-span-1",
    large: "col-span-2 row-span-2"
  }[layout.size];

  return (
    <Card className={`${sizeClasses} relative group animate-fade-in`}>
      {/* Control bar that appears on hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(layout.id)}>
          <Settings className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(layout.id)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Drag handle */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
        <Grip className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-medium">{layout.title}</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        {children}
      </CardContent>
    </Card>
  );
};

// Widget type selection dialog
interface WidgetTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: WidgetType) => void;
}

const WidgetTypeDialog = ({ open, onOpenChange, onSelect }: WidgetTypeDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
          <DialogDescription>
            Select the type of widget you want to add to your dashboard
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button 
            variant="outline" 
            className="h-24 flex flex-col gap-2 hover:border-primary"
            onClick={() => onSelect('chart')}
          >
            <LineChart className="h-8 w-8" />
            <span>Chart</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-24 flex flex-col gap-2 hover:border-primary"
            onClick={() => onSelect('statistics')}
          >
            <SquareStack className="h-8 w-8" />
            <span>Statistics</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-24 flex flex-col gap-2 hover:border-primary"
            onClick={() => onSelect('table')}
          >
            <BarChart className="h-8 w-8" />
            <span>Table</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-24 flex flex-col gap-2 hover:border-primary"
            onClick={() => onSelect('prediction')}
          >
            <PieChart className="h-8 w-8" />
            <span>Prediction</span>
          </Button>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Widget configuration dialog
interface WidgetConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layout?: DashboardWidget;
  onSave: (layout: DashboardWidget) => void;
  isNew?: boolean;
}

const WidgetConfigDialog = ({ open, onOpenChange, layout, onSave, isNew = false }: WidgetConfigDialogProps) => {
  const [title, setTitle] = useState(layout?.title || "");
  const [size, setSize] = useState(layout?.size || "medium");
  const [dataSource, setDataSource] = useState(layout?.dataSource || "");
  
  // Reset form when dialog opens with new layout
  React.useEffect(() => {
    if (layout) {
      setTitle(layout.title);
      setSize(layout.size);
      setDataSource(layout.dataSource);
    }
  }, [layout]);
  
  const handleSave = () => {
    if (!layout) return;
    
    const updatedLayout: DashboardWidget = {
      ...layout,
      title,
      size: size as 'small' | 'medium' | 'large',
      dataSource,
      // In a real app, you'd have more configuration options
      config: { ...layout.config }
    };
    
    onSave(updatedLayout);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isNew ? "Add Widget" : "Edit Widget"}</DialogTitle>
          <DialogDescription>
            Configure your dashboard widget
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Widget Title</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Enter widget title"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="size">Widget Size</Label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger id="size">
                <SelectValue placeholder="Select widget size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small (1x1)</SelectItem>
                <SelectItem value="medium">Medium (2x1)</SelectItem>
                <SelectItem value="large">Large (2x2)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dataSource">Data Source</Label>
            <Select value={dataSource} onValueChange={setDataSource}>
              <SelectTrigger id="dataSource">
                <SelectValue placeholder="Select data source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="departmentPerformance">Department Performance</SelectItem>
                <SelectItem value="resourceUtilization">Resource Utilization</SelectItem>
                <SelectItem value="taskCompletion">Task Completion</SelectItem>
                <SelectItem value="workloadPrediction">Workload Prediction</SelectItem>
                <SelectItem value="taskDistribution">Task Distribution</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title || !dataSource}>
            Save Widget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Save dashboard dialog
interface SaveDashboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboard: AnalyticsDashboard;
  onSave: (dashboard: AnalyticsDashboard) => void;
  isNew?: boolean;
}

const SaveDashboardDialog = ({ open, onOpenChange, dashboard, onSave, isNew = false }: SaveDashboardDialogProps) => {
  const { departments } = useDepartments();
  const [name, setName] = useState(dashboard?.name || "");
  const [description, setDescription] = useState(dashboard?.description || "");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(dashboard?.departments || ["all"]);
  const [isDefault, setIsDefault] = useState(dashboard?.isDefault || false);
  
  // Reset form when dialog opens with new dashboard
  React.useEffect(() => {
    if (dashboard) {
      setName(dashboard.name);
      setDescription(dashboard.description);
      setSelectedDepartments(dashboard.departments);
      setIsDefault(dashboard.isDefault);
    }
  }, [dashboard]);
  
  const handleSave = () => {
    if (!dashboard) return;
    
    const updatedDashboard: AnalyticsDashboard = {
      ...dashboard,
      name,
      description,
      departments: selectedDepartments,
      isDefault
    };
    
    onSave(updatedDashboard);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isNew ? "Save New Dashboard" : "Update Dashboard"}</DialogTitle>
          <DialogDescription>
            Give your dashboard a name and description
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Dashboard Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Enter dashboard name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Enter dashboard description"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="departments">Departments</Label>
            <Select 
              value={selectedDepartments.length === 1 ? selectedDepartments[0] : "multiple"}
              onValueChange={(value) => {
                if (value === "all") {
                  setSelectedDepartments(["all"]);
                } else {
                  setSelectedDepartments(prev => 
                    prev.includes("all") ? [value] : [...prev.filter(d => d !== "all"), value]
                  );
                }
              }}
            >
              <SelectTrigger id="departments">
                <SelectValue placeholder="Select departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                ))}
                {selectedDepartments.length > 1 && (
                  <SelectItem value="multiple">{selectedDepartments.length} departments selected</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="isDefault">Set as default dashboard</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name}>
            Save Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface CustomizableDashboardProps {
  dashboard: AnalyticsDashboard;
  onSave: (dashboard: AnalyticsDashboard) => Promise<void>;
}

export const CustomizableDashboard: React.FC<CustomizableDashboardProps> = ({ 
  dashboard,
  onSave
}) => {
  const { user } = useAuth();
  const { createDashboard, updateDashboard, getDefaultDashboard } = usePredictiveAnalytics();
  
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedDashboard, setEditedDashboard] = useState<AnalyticsDashboard>({ ...dashboard });
  const [newWidgetType, setNewWidgetType] = useState<string>('chart');
  const [newWidgetTitle, setNewWidgetTitle] = useState<string>('');
  const [newWidgetMetric, setNewWidgetMetric] = useState<string>('PERFORMANCE');
  const [newWidgetSize, setNewWidgetSize] = useState<string>('medium');
  
  const { predictions } = usePredictiveAnalytics();
  
  const addWidget = () => {
    if (!newWidgetTitle) {
      toast({
        title: "Missing Title",
        description: "Please provide a title for the widget",
        variant: "destructive"
      });
      return;
    }
    
    // Calculate position (simple placement for now)
    let nextX = 0;
    let nextY = 0;
    let width = 4;
    let height = 2;
    
    // Adjust size based on selection
    if (newWidgetSize === 'small') {
      width = 3;
      height = 2;
    } else if (newWidgetSize === 'large') {
      width = 6;
      height = 3;
    }
    
    // Find the lowest y position to place the new widget
    if (editedDashboard.layout.widgets.length > 0) {
      const maxY = Math.max(
        ...editedDashboard.layout.widgets.map(w => w.position.y + w.position.h)
      );
      nextY = maxY;
    }
    
    // Create new widget
    const newWidget = {
      id: uuidv4(),
      type: newWidgetType as 'chart' | 'statistics' | 'table' | 'prediction',
      title: newWidgetTitle,
      dataSource: newWidgetType === 'prediction' && predictions.length > 0 
        ? predictions[0]._id 
        : `${newWidgetMetric.toLowerCase()}-data`,
      metricType: newWidgetMetric as any,
      size: newWidgetSize as 'small' | 'medium' | 'large',
      position: { x: nextX, y: nextY, w: width, h: height }
    };
    
    // Add to dashboard
    setEditedDashboard(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        widgets: [...prev.layout.widgets, newWidget]
      }
    }));
    
    // Close dialog and reset form
    setIsAddWidgetOpen(false);
    setNewWidgetTitle('');
    setNewWidgetType('chart');
    setNewWidgetMetric('PERFORMANCE');
    setNewWidgetSize('medium');
    
    toast({
      title: "Widget Added",
      description: `${newWidgetTitle} has been added to your dashboard`
    });
  };
  
  const removeWidget = (widgetId: string) => {
    setEditedDashboard(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        widgets: prev.layout.widgets.filter(w => w.id !== widgetId)
      }
    }));
    
    toast({
      title: "Widget Removed",
      description: "The widget has been removed from your dashboard"
    });
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedDashboard);
      toast({
        title: "Dashboard Saved",
        description: "Your dashboard layout has been saved successfully"
      });
      setIsEditingLayout(false);
    } catch (error) {
      console.error("Error saving dashboard:", error);
      toast({
        title: "Save Failed",
        description: "There was a problem saving your dashboard",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Render a widget based on its type
  const renderWidget = (widget: any) => {
    const { type, title, dataSource, metricType } = widget;
    
    switch (type) {
      case 'chart':
        return (
          <div className="w-full h-full flex flex-col">
            <h3 className="text-lg font-medium mb-2">{title}</h3>
            <div className="flex-grow">
              <PredictiveChart 
                metricType={metricType}
                timeframe="QUARTERLY"
                department="Development"
              />
            </div>
          </div>
        );
        
      case 'prediction':
        const prediction = predictions.find(p => p._id === dataSource);
        return (
          <div className="w-full h-full flex flex-col">
            <h3 className="text-lg font-medium mb-2">{title}</h3>
            {prediction ? (
              <div className="flex-grow">
                <PredictiveChart data={prediction} />
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>Model accuracy: {(prediction.accuracy * 100).toFixed(1)}%</p>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">No prediction data found</div>
            )}
          </div>
        );
        
      case 'statistics':
        return (
          <div className="w-full h-full flex flex-col">
            <h3 className="text-lg font-medium mb-2">{title}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-3 rounded-md">
                <div className="text-2xl font-bold">78%</div>
                <div className="text-xs text-muted-foreground">Efficiency</div>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <div className="text-2xl font-bold">92%</div>
                <div className="text-xs text-muted-foreground">Utilization</div>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <div className="text-2xl font-bold">64%</div>
                <div className="text-xs text-muted-foreground">Progress</div>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <div className="text-2xl font-bold">85%</div>
                <div className="text-xs text-muted-foreground">Quality</div>
              </div>
            </div>
          </div>
        );
        
      case 'table':
        return (
          <div className="w-full h-full flex flex-col">
            <h3 className="text-lg font-medium mb-2">{title}</h3>
            <div className="text-sm">
              <div className="grid grid-cols-3 gap-2 font-medium mb-2">
                <div>Metric</div>
                <div>Current</div>
                <div>Trend</div>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-t">
                <div>Performance</div>
                <div>87%</div>
                <div className="text-green-500">↑ 3%</div>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-t">
                <div>Efficiency</div>
                <div>74%</div>
                <div className="text-red-500">↓ 2%</div>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-t">
                <div>Workload</div>
                <div>82%</div>
                <div className="text-green-500">↑ 5%</div>
              </div>
            </div>
          </div>
        );
        
      default:
        return <div>Unsupported widget type</div>;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">{editedDashboard.name}</h2>
          {editedDashboard.description && (
            <p className="text-sm text-muted-foreground">{editedDashboard.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {isEditingLayout ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsAddWidgetOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Widget
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save Layout'}
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditingLayout(true)}
            >
              <Settings className="h-4 w-4 mr-1" />
              Edit Layout
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-4">
        {editedDashboard.layout.widgets.map(widget => (
          <Card 
            key={widget.id} 
            className={`col-span-${widget.position.w} row-span-${widget.position.h} min-h-[${widget.position.h * 100}px]`}
            style={{
              gridColumn: `span ${widget.position.w}`,
              gridRow: `span ${widget.position.h}`,
              minHeight: `${widget.position.h * 100}px`,
            }}
          >
            <CardContent className="p-4 h-full">
              {isEditingLayout && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => removeWidget(widget.id)}
                >
                  <Trash className="h-4 w-4 text-destructive" />
                </Button>
              )}
              {renderWidget(widget)}
            </CardContent>
          </Card>
        ))}
        
        {editedDashboard.layout.widgets.length === 0 && (
          <div className="col-span-12 py-8 text-center bg-muted rounded-lg">
            <p className="text-muted-foreground mb-4">This dashboard is empty</p>
            {isEditingLayout && (
              <Button onClick={() => setIsAddWidgetOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Widget
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Add Widget Dialog */}
      <Dialog open={isAddWidgetOpen} onOpenChange={setIsAddWidgetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Dashboard Widget</DialogTitle>
            <DialogDescription>
              Create a new widget to display on your analytics dashboard.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="widget-title">Widget Title</Label>
              <Input
                id="widget-title"
                placeholder="Enter a title for this widget"
                value={newWidgetTitle}
                onChange={(e) => setNewWidgetTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="widget-type">Widget Type</Label>
              <Select
                value={newWidgetType}
                onValueChange={setNewWidgetType}
              >
                <SelectTrigger id="widget-type">
                  <SelectValue placeholder="Select widget type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chart">Chart</SelectItem>
                  <SelectItem value="statistics">Statistics</SelectItem>
                  <SelectItem value="table">Table</SelectItem>
                  <SelectItem value="prediction">Prediction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {newWidgetType !== 'prediction' && (
              <div className="space-y-2">
                <Label htmlFor="widget-metric">Metric Type</Label>
                <Select
                  value={newWidgetMetric}
                  onValueChange={setNewWidgetMetric}
                >
                  <SelectTrigger id="widget-metric">
                    <SelectValue placeholder="Select metric type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERFORMANCE">Performance</SelectItem>
                    <SelectItem value="WORKLOAD">Workload</SelectItem>
                    <SelectItem value="EFFICIENCY">Efficiency</SelectItem>
                    <SelectItem value="SKILLS">Skills</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {newWidgetType === 'prediction' && (
              <div className="space-y-2">
                <Label htmlFor="widget-prediction">Prediction</Label>
                <Select defaultValue={predictions.length > 0 ? predictions[0]._id : undefined}>
                  <SelectTrigger id="widget-prediction">
                    <SelectValue placeholder="Select a prediction" />
                  </SelectTrigger>
                  <SelectContent>
                    {predictions.map(prediction => (
                      <SelectItem key={prediction._id} value={prediction._id}>
                        {prediction.title}
                      </SelectItem>
                    ))}
                    {predictions.length === 0 && (
                      <SelectItem value="none" disabled>
                        No predictions available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="widget-size">Widget Size</Label>
              <Select
                value={newWidgetSize}
                onValueChange={setNewWidgetSize}
              >
                <SelectTrigger id="widget-size">
                  <SelectValue placeholder="Select widget size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddWidgetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addWidget}>
              Add Widget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 