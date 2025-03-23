import React, { useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  FileBarChart,
  Mail,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Trash2,
  UserRound,
  Play,
  Edit,
  AlertCircle,
  Trash
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { usePredictiveAnalytics, MetricType, ScheduleFrequency, PredictionTimeframe, ReportSchedule } from "@/components/PredictiveAnalyticsProvider";
import { useDepartments } from '@/components/DepartmentsProvider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface ScheduledReportsCardProps {
  className?: string;
}

export function ScheduledReportsCard({ className = "" }: ScheduledReportsCardProps) {
  const { scheduledReports, createScheduledReport, updateScheduledReport, deleteScheduledReport, runScheduledReport } = usePredictiveAnalytics();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportSchedule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMetricType, setFormMetricType] = useState<MetricType>('PERFORMANCE');
  const [formTimeframe, setFormTimeframe] = useState<PredictionTimeframe>('WEEKLY');
  const [formRecipients, setFormRecipients] = useState('');
  const [formIncludeData, setFormIncludeData] = useState(true);
  const [formIncludeVisuals, setFormIncludeVisuals] = useState(true);
  const [formActive, setFormActive] = useState(true);
  const [formDepartment, setFormDepartment] = useState('');
  
  const { departments } = useDepartments();

  const handleCreateReport = () => {
    // Reset form
    setFormName('');
    setFormDescription('');
    setFormMetricType('PERFORMANCE');
    setFormTimeframe('WEEKLY');
    setFormRecipients('');
    setFormIncludeData(true);
    setFormIncludeVisuals(true);
    setFormActive(true);
    setFormDepartment(departments[0]?.id || '');
    
    setSelectedReport(null);
    setIsCreateDialogOpen(true);
  };
  
  const handleEditReport = (report: ReportSchedule) => {
    setFormName(report.name);
    setFormDescription(report.description || '');
    setFormMetricType(report.metricType);
    setFormTimeframe(report.timeframe);
    setFormRecipients(report.recipients.join(', '));
    setFormIncludeData(report.includeDataExport);
    setFormIncludeVisuals(report.includeVisualizations);
    setFormActive(report.isActive);
    setFormDepartment(report.department || departments[0]?.id || '');
    
    setSelectedReport(report);
    setIsCreateDialogOpen(true);
  };
  
  const handleDeleteClick = (report: ReportSchedule) => {
    setSelectedReport(report);
    setIsDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!selectedReport) return;
    
    try {
      await deleteScheduledReport(selectedReport._id);
      toast({
        title: 'Report Deleted',
        description: 'The scheduled report has been deleted successfully.'
      });
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the report. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  const handleSubmitForm = async () => {
    // Validate form
    if (!formName) {
      toast({
        title: 'Missing Field',
        description: 'Please provide a name for the report',
        variant: 'destructive'
      });
      return;
    }
    
    if (!formRecipients) {
      toast({
        title: 'Missing Field',
        description: 'Please provide at least one recipient email',
        variant: 'destructive'
      });
      return;
    }
    
    // Parse recipients
    const recipientEmails = formRecipients
      .split(',')
      .map(email => email.trim())
      .filter(email => email.includes('@'));
    
    if (recipientEmails.length === 0) {
      toast({
        title: 'Invalid Recipients',
        description: 'Please provide valid email addresses separated by commas',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (selectedReport) {
        // Update existing report
        await updateScheduledReport({
          ...selectedReport,
          name: formName,
          description: formDescription,
          metricType: formMetricType,
          timeframe: formTimeframe,
          recipients: recipientEmails,
          includeDataExport: formIncludeData,
          includeVisualizations: formIncludeVisuals,
          isActive: formActive,
          department: formDepartment
        });
        
        toast({
          title: 'Report Updated',
          description: 'The scheduled report has been updated successfully.'
        });
      } else {
        // Create new report
        await createScheduledReport({
          name: formName,
          description: formDescription,
          metricType: formMetricType,
          timeframe: formTimeframe,
          recipients: recipientEmails,
          includeDataExport: formIncludeData,
          includeVisualizations: formIncludeVisuals,
          isActive: formActive,
          department: formDepartment
        });
        
        toast({
          title: 'Report Created',
          description: 'The scheduled report has been created successfully.'
        });
      }
      
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: 'Error',
        description: 'Failed to save the report. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRunReport = async (reportId: string) => {
    try {
      await runScheduledReport(reportId);
      toast({
        title: 'Report Running',
        description: 'The report is being generated and will be sent to recipients shortly.'
      });
    } catch (error) {
      console.error('Error running report:', error);
      toast({
        title: 'Error',
        description: 'Failed to run the report. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  const formatNextRun = (dateString?: string) => {
    if (!dateString) return 'Not scheduled';
    
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    // If less than a day
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `In ${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    
    // If less than a week
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `In ${days} day${days !== 1 ? 's' : ''}`;
    }
    
    // Otherwise return the date
    return date.toLocaleDateString();
  };

  return (
    <>
      <Card className={`${className}`}>
        <CardHeader className="space-y-0 pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileBarChart className="h-4 w-4 text-primary" />
                Scheduled Reports
              </CardTitle>
              <CardDescription>
                Automate department reports and insights delivery
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleCreateReport}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Report
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-2">
          {scheduledReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground py-8">
              <AlertCircle className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-center">No scheduled reports configured yet</p>
              <p className="text-center text-sm mt-2">
                Create a new report to automate insights delivery
              </p>
              <Button onClick={handleCreateReport}>Create Your First Report</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduledReports.map(report => (
                    <TableRow key={report._id}>
                      <TableCell className="font-medium">
                        {report.name}
                        <div className="text-xs text-muted-foreground">
                          {report.metricType} metrics
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          {report.timeframe}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                          {formatNextRun(report.nextRun)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={report.isActive ? 'default' : 'outline'}>
                          {report.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRunReport(report._id)}
                            title="Run now"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditReport(report)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(report)}
                            title="Delete"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="pt-2">
          <div className="w-full text-xs text-muted-foreground">
            Reports are sent automatically based on the scheduled frequency.
          </div>
        </CardFooter>
      </Card>
      
      {/* Create/Edit Report Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedReport ? 'Edit Scheduled Report' : 'Create Scheduled Report'}
            </DialogTitle>
            <DialogDescription>
              Configure a report to be automatically generated and sent to stakeholders.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="report-name">Report Name</Label>
              <Input
                id="report-name"
                placeholder="E.g., Weekly Performance Report"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="report-description">Description (Optional)</Label>
              <Textarea
                id="report-description"
                placeholder="Brief description of what this report contains"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="report-metric">Metric Type</Label>
                <Select
                  value={formMetricType}
                  onValueChange={(value) => setFormMetricType(value as MetricType)}
                >
                  <SelectTrigger id="report-metric">
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERFORMANCE">Performance</SelectItem>
                    <SelectItem value="WORKLOAD">Workload</SelectItem>
                    <SelectItem value="EFFICIENCY">Efficiency</SelectItem>
                    <SelectItem value="SKILLS">Skills Gap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="report-frequency">Frequency</Label>
                <Select
                  value={formTimeframe}
                  onValueChange={(value) => setFormTimeframe(value as PredictionTimeframe)}
                >
                  <SelectTrigger id="report-frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="report-department">Department</Label>
              <Select
                value={formDepartment}
                onValueChange={setFormDepartment}
              >
                <SelectTrigger id="report-department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="report-recipients">Recipients (comma-separated emails)</Label>
              <Input
                id="report-recipients"
                placeholder="email1@example.com, email2@example.com"
                value={formRecipients}
                onChange={(e) => setFormRecipients(e.target.value)}
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="include-data" 
                  checked={formIncludeData}
                  onCheckedChange={(checked) => setFormIncludeData(!!checked)}
                />
                <Label htmlFor="include-data">Include data export (CSV)</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="include-visuals" 
                  checked={formIncludeVisuals}
                  onCheckedChange={(checked) => setFormIncludeVisuals(!!checked)}
                />
                <Label htmlFor="include-visuals">Include visualizations</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="active-status" 
                  checked={formActive}
                  onCheckedChange={(checked) => setFormActive(!!checked)}
                />
                <Label htmlFor="active-status">Active (will be scheduled)</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitForm}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : selectedReport ? 'Update Report' : 'Create Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this scheduled report? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Delete Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 