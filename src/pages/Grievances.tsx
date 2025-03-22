import React, { useState, useEffect } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  FileText,
  Filter,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserCircle,
  ChevronRight,
  Send,
  MoreHorizontal,
  ArrowRightCircle,
  ArrowUpCircle,
  Download,
  UploadCloud,
  Plus
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardHeader } from "@/components/layouts/DashboardHeader";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { useGrievance, GrievanceStatus, GrievancePriority, GrievanceCategory } from '@/components/GrievanceProvider';
import { useAuth } from '@/components/AuthProvider';
import { useAudit } from '@/components/AuditProvider';
import { format, formatDistanceToNow } from 'date-fns';

// Helper function to get status badge color
const getStatusColor = (status: GrievanceStatus) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'in-review': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'escalated': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
};

// Helper function to get priority badge color
const getPriorityColor = (priority: GrievancePriority) => {
  switch (priority) {
    case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
};

// Helper function to get category badge color
const getCategoryColor = (category: GrievanceCategory) => {
  switch (category) {
    case 'hr': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
    case 'technical': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
    case 'management': return 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200';
    case 'financial': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
    case 'infrastructure': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'other': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
};

export function Grievances() {
  const { grievances, addGrievance, updateGrievanceStatus, assignGrievance, addComment, escalateGrievance, resolveGrievance } = useGrievance();
  const { user } = useAuth();
  const { addAuditLog } = useAudit();
  
  // States for filtering grievances
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState<GrievanceStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<GrievancePriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<GrievanceCategory | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // States for new grievance
  const [newGrievanceOpen, setNewGrievanceOpen] = useState(false);
  const [newGrievance, setNewGrievance] = useState({
    title: '',
    description: '',
    category: 'other' as GrievanceCategory,
    department: 'HR',
    priority: 'medium' as GrievancePriority,
    status: 'pending' as GrievanceStatus,
    isAnonymous: false
  });
  
  // State for viewing a specific grievance
  const [selectedGrievance, setSelectedGrievance] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState({
    open: false,
    status: '' as GrievanceStatus,
    comment: ''
  });
  
  // Filter grievances based on active filters
  const filteredGrievances = grievances.filter(grievance => {
    // Tab filters
    if (activeTab === 'my-grievances' && grievance.createdBy !== user?.id) return false;
    if (activeTab === 'assigned' && grievance.assignedTo !== user?.id) return false;
    if (activeTab === 'unassigned' && grievance.assignedTo) return false;
    
    // Search query
    if (
      searchQuery && 
      !grievance.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
      !grievance.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) return false;
    
    // Status filter
    if (statusFilter !== 'all' && grievance.status !== statusFilter) return false;
    
    // Priority filter
    if (priorityFilter !== 'all' && grievance.priority !== priorityFilter) return false;
    
    // Category filter
    if (categoryFilter !== 'all' && grievance.category !== categoryFilter) return false;
    
    // Department filter
    if (departmentFilter !== 'all' && grievance.department !== departmentFilter) return false;
    
    return true;
  });

  // Sort grievances by date - newest first
  const sortedGrievances = [...filteredGrievances].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  // Get currently selected grievance
  const currentGrievance = selectedGrievance 
    ? grievances.find(g => g.id === selectedGrievance) 
    : null;

  // Handler for submitting a new grievance
  const handleSubmitGrievance = () => {
    if (!user) return;
    
    // Validate form
    if (!newGrievance.title || !newGrievance.description) {
      return;
    }
    
    // Create grievance
    addGrievance({
      ...newGrievance,
      createdBy: user.id,
      createdByName: user.name
    });
    
    // Reset form and close dialog
    setNewGrievance({
      title: '',
      description: '',
      category: 'other',
      department: 'HR',
      priority: 'medium',
      status: 'pending',
      isAnonymous: false
    });
    setNewGrievanceOpen(false);
  };

  // Handler for submitting a comment
  const handleSubmitComment = () => {
    if (!selectedGrievance || !commentText.trim()) return;
    
    addComment(selectedGrievance, commentText, isInternalComment);
    setCommentText('');
    setIsInternalComment(false);
  };

  // Handler for updating status
  const handleStatusUpdate = () => {
    if (!selectedGrievance || !statusUpdateDialog.status || !statusUpdateDialog.comment) return;
    
    updateGrievanceStatus(
      selectedGrievance, 
      statusUpdateDialog.status as GrievanceStatus, 
      statusUpdateDialog.comment
    );
    
    setStatusUpdateDialog({
      open: false,
      status: '' as GrievanceStatus,
      comment: ''
    });
  };

  // Handler for escalating a grievance
  const handleEscalate = () => {
    if (!selectedGrievance || !statusUpdateDialog.comment) return;
    
    escalateGrievance(selectedGrievance, statusUpdateDialog.comment);
    
    setStatusUpdateDialog({
      open: false,
      status: '' as GrievanceStatus,
      comment: ''
    });
  };

  // Handler for resolving a grievance
  const handleResolve = () => {
    if (!selectedGrievance || !statusUpdateDialog.comment) return;
    
    resolveGrievance(selectedGrievance, statusUpdateDialog.comment);
    
    setStatusUpdateDialog({
      open: false,
      status: '' as GrievanceStatus,
      comment: ''
    });
  };

  // Handler for assigning a grievance
  const handleAssign = (grievanceId: string) => {
    if (!user) return;
    
    assignGrievance(grievanceId, user.id, user.name);
  };

  return (
    <>
      <DashboardShell>
        <DashboardHeader 
          heading="Grievances & Redressal" 
          description="Manage employee grievances and track their resolution progress"
          sidebarCollapsed={false}
          setSidebarCollapsed={() => {}}
        >
          <Button onClick={() => setNewGrievanceOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Submit Grievance
          </Button>
        </DashboardHeader>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center justify-between">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                placeholder="Search grievances..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status-filter">Status</Label>
                    <Select
                      value={statusFilter}
                      onValueChange={(value) => setStatusFilter(value as GrievanceStatus | 'all')}
                    >
                      <SelectTrigger id="status-filter">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-review">In Review</SelectItem>
                        <SelectItem value="escalated">Escalated</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="priority-filter">Priority</Label>
                    <Select
                      value={priorityFilter}
                      onValueChange={(value) => setPriorityFilter(value as GrievancePriority | 'all')}
                    >
                      <SelectTrigger id="priority-filter">
                        <SelectValue placeholder="Filter by priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category-filter">Category</Label>
                    <Select
                      value={categoryFilter}
                      onValueChange={(value) => setCategoryFilter(value as GrievanceCategory | 'all')}
                    >
                      <SelectTrigger id="category-filter">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="management">Management</SelectItem>
                        <SelectItem value="financial">Financial</SelectItem>
                        <SelectItem value="infrastructure">Infrastructure</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="department-filter">Department</Label>
                    <Select
                      value={departmentFilter}
                      onValueChange={setDepartmentFilter}
                    >
                      <SelectTrigger id="department-filter">
                        <SelectValue placeholder="Filter by department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Development">Development</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="my-grievances">My Grievances</TabsTrigger>
              <TabsTrigger value="assigned">Assigned to Me</TabsTrigger>
              <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
            </TabsList>
            
            {/* Tab content - all tabs use the same content, filtered by the activeTab value */}
            <TabsContent value={activeTab} className="mt-6">
              {sortedGrievances.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-xl font-semibold mb-2">No grievances found</p>
                    <p className="text-muted-foreground text-center max-w-md">
                      {activeTab === 'my-grievances'
                        ? "You haven't submitted any grievances yet."
                        : activeTab === 'assigned'
                        ? "No grievances are currently assigned to you."
                        : activeTab === 'unassigned'
                        ? "There are no unassigned grievances at the moment."
                        : "No grievances match your current filters."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {sortedGrievances.map((grievance) => (
                    <Card key={grievance.id} className="overflow-hidden">
                      <CardHeader className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl mb-1">{grievance.title}</CardTitle>
                            <CardDescription className="text-sm">
                              {grievance.isAnonymous ? 'Anonymous' : grievance.createdByName} • {grievance.department} • 
                              {formatDistanceToNow(new Date(grievance.createdAt), { addSuffix: true })}
                            </CardDescription>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={getStatusColor(grievance.status)}>
                              {grievance.status.charAt(0).toUpperCase() + grievance.status.slice(1).replace('-', ' ')}
                            </Badge>
                            <Badge className={getPriorityColor(grievance.priority)}>
                              {grievance.priority.charAt(0).toUpperCase() + grievance.priority.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-sm line-clamp-2 mb-2">{grievance.description}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Badge variant="outline" className={getCategoryColor(grievance.category)}>
                            {grievance.category.charAt(0).toUpperCase() + grievance.category.slice(1)}
                          </Badge>
                          <div className="ml-4 flex items-center">
                            <MessageCircle className="mr-1 h-4 w-4" />
                            <span>{grievance.comments.length} comments</span>
                          </div>
                          <div className="ml-4 flex items-center">
                            <Clock className="mr-1 h-4 w-4" />
                            <span>Updated {formatDistanceToNow(new Date(grievance.updatedAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between p-4 pt-0">
                        <div>
                          {grievance.assignedTo ? (
                            <div className="flex items-center text-sm">
                              <span className="text-muted-foreground mr-2">Assigned to:</span>
                              <Avatar className="h-6 w-6 mr-1">
                                <AvatarFallback>{grievance.assignedToName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              {grievance.assignedToName}
                            </div>
                          ) : (
                            user?.role !== 'employee' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleAssign(grievance.id)}
                              >
                                <UserCircle className="mr-2 h-4 w-4" />
                                Assign to me
                              </Button>
                            )
                          )}
                        </div>
                        <Button 
                          onClick={() => setSelectedGrievance(grievance.id)}
                          size="sm"
                        >
                          View Details
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DashboardShell>
      
      {/* New Grievance Dialog */}
      <Dialog open={newGrievanceOpen} onOpenChange={setNewGrievanceOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Submit New Grievance</DialogTitle>
            <DialogDescription>
              Provide details about your grievance. Our team will review it promptly.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newGrievance.title}
                onChange={(e) => setNewGrievance({ ...newGrievance, title: e.target.value })}
                placeholder="Briefly describe your grievance"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newGrievance.description}
                onChange={(e) => setNewGrievance({ ...newGrievance, description: e.target.value })}
                placeholder="Provide detailed information about your grievance"
                rows={5}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newGrievance.category}
                  onValueChange={(value) => setNewGrievance({ ...newGrievance, category: value as GrievanceCategory })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={newGrievance.department}
                  onValueChange={(value) => setNewGrievance({ ...newGrievance, department: value })}
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Development">Development</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newGrievance.priority}
                  onValueChange={(value) => setNewGrievance({ ...newGrievance, priority: value as GrievancePriority })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="isAnonymous"
                  checked={newGrievance.isAnonymous}
                  onCheckedChange={(checked) => 
                    setNewGrievance({ ...newGrievance, isAnonymous: checked as boolean })
                  }
                />
                <Label htmlFor="isAnonymous">Submit anonymously</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewGrievanceOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitGrievance}>Submit Grievance</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Grievance Detail Dialog */}
      {currentGrievance && (
        <Dialog open={!!selectedGrievance} onOpenChange={(open) => !open && setSelectedGrievance(null)}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl">{currentGrievance.title}</DialogTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(currentGrievance.status)}>
                    {currentGrievance.status.charAt(0).toUpperCase() + currentGrievance.status.slice(1).replace('-', ' ')}
                  </Badge>
                  <Badge className={getPriorityColor(currentGrievance.priority)}>
                    {currentGrievance.priority.charAt(0).toUpperCase() + currentGrievance.priority.slice(1)}
                  </Badge>
                </div>
              </div>
              <DialogDescription>
                <div className="flex items-center justify-between mt-2">
                  <div>
                    ID: {currentGrievance.id} • {currentGrievance.isAnonymous ? 'Anonymous' : currentGrievance.createdByName} • 
                    {format(new Date(currentGrievance.createdAt), 'PPpp')}
                  </div>
                  <Badge variant="outline" className={getCategoryColor(currentGrievance.category)}>
                    {currentGrievance.category.charAt(0).toUpperCase() + currentGrievance.category.slice(1)}
                  </Badge>
                </div>
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4 overflow-y-auto max-h-[60vh]">
              {/* Description */}
              <div className="space-y-2">
                <h3 className="font-medium">Description</h3>
                <p className="text-sm">{currentGrievance.description}</p>
              </div>
              
              <Separator />
              
              {/* Status History */}
              <div className="space-y-4">
                <h3 className="font-medium">Status History</h3>
                <div className="space-y-3">
                  {currentGrievance.statusHistory.map((update) => (
                    <div key={update.id} className="bg-muted p-3 rounded-md">
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(update.status)}>
                          {update.status.charAt(0).toUpperCase() + update.status.slice(1).replace('-', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(update.timestamp), 'PPp')}
                        </span>
                      </div>
                      <p className="mt-2 text-sm">{update.comment}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Updated by: {update.updatedByName}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Comments */}
              <div className="space-y-4">
                <h3 className="font-medium">Comments</h3>
                {currentGrievance.comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No comments yet.</p>
                ) : (
                  <div className="space-y-3">
                    {currentGrievance.comments.map((comment) => (
                      <div 
                        key={comment.id} 
                        className={`p-3 rounded-md border ${
                          comment.isInternal ? 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800' : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>{comment.createdByName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{comment.createdByName}</span>
                            {comment.isInternal && (
                              <Badge variant="outline" className="text-xs">Internal</Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.createdAt), 'PPp')}
                          </span>
                        </div>
                        <p className="mt-2 text-sm">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Footer */}
            <div className="pt-0">
              {currentGrievance && (currentGrievance.status as string) !== 'resolved' && (
                <>
                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox
                      id="internal-comment"
                      checked={isInternalComment}
                      onCheckedChange={(checked) => setIsInternalComment(!!checked)}
                    />
                    <Label htmlFor="internal-comment" className="text-sm">
                      Internal comment (only visible to staff)
                    </Label>
                  </div>
                  <div className="flex space-x-2">
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="min-h-[60px]"
                    />
                    <Button 
                      className="mt-auto" 
                      size="icon" 
                      onClick={handleSubmitComment}
                      disabled={!commentText.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex justify-between mt-4">
                    <div className="flex space-x-2">
                      {(user?.role === 'admin' || user?.role === 'manager') && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => setStatusUpdateDialog({
                              open: true,
                              status: 'in-review',
                              comment: ''
                            })}
                            disabled={currentGrievance.status === 'in-review'}
                          >
                            Mark In Review
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setStatusUpdateDialog({
                              open: true,
                              status: 'escalated',
                              comment: ''
                            })}
                            disabled={currentGrievance.status === 'escalated'}
                          >
                            <ArrowUpCircle className="mr-2 h-4 w-4" />
                            Escalate
                          </Button>
                        </>
                      )}
                    </div>
                    
                    <Button
                      variant="default"
                      onClick={() => setStatusUpdateDialog({
                        open: true,
                        status: 'resolved',
                        comment: ''
                      })}
                      disabled={currentGrievance.status === 'resolved'}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Resolve
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Status Update Dialog */}
      <Dialog open={statusUpdateDialog.open} onOpenChange={(open) => !open && setStatusUpdateDialog({ ...statusUpdateDialog, open: false })}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {statusUpdateDialog.status === 'escalated'
                ? 'Escalate Grievance'
                : statusUpdateDialog.status === 'resolved'
                ? 'Resolve Grievance'
                : `Update Status to ${statusUpdateDialog.status?.replace('-', ' ')}`}
            </DialogTitle>
            <DialogDescription>
              {statusUpdateDialog.status === 'escalated'
                ? 'Provide a reason for escalating this grievance to higher management'
                : statusUpdateDialog.status === 'resolved'
                ? 'Provide details about how this grievance was resolved'
                : 'Add comments explaining this status change'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status-comment">Comment</Label>
              <Textarea
                id="status-comment"
                value={statusUpdateDialog.comment}
                onChange={(e) => setStatusUpdateDialog({ ...statusUpdateDialog, comment: e.target.value })}
                placeholder={
                  statusUpdateDialog.status === 'escalated'
                    ? 'Reason for escalation...'
                    : statusUpdateDialog.status === 'resolved'
                    ? 'Resolution details...'
                    : 'Comment about status change...'
                }
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusUpdateDialog({ ...statusUpdateDialog, open: false })}>
              Cancel
            </Button>
            <Button
              onClick={
                statusUpdateDialog.status === 'escalated'
                  ? handleEscalate
                  : statusUpdateDialog.status === 'resolved'
                  ? handleResolve
                  : handleStatusUpdate
              }
              disabled={!statusUpdateDialog.comment}
            >
              {statusUpdateDialog.status === 'escalated'
                ? 'Escalate'
                : statusUpdateDialog.status === 'resolved'
                ? 'Resolve'
                : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 