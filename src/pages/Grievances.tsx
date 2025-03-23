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
  Plus,
  Search,
  Activity,
  MoreVertical,
  Copy,
  Trash,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { DashboardHeader } from "@/components/layouts/DashboardHeader";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { useGrievance, GrievanceStatus, GrievancePriority, GrievanceCategory } from '@/components/GrievanceProvider';
import { useAuth } from '@/components/AuthProvider';
import { useAudit } from '@/components/AuditProvider';
import { format, formatDistanceToNow } from 'date-fns';

// Helper functions
function formatDate(date) {
  return formatDistanceToNow(date, { addSuffix: true });
}

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function getPriorityVariant(priority) {
  switch (priority.toLowerCase()) {
    case "low":
      return "outline";
    case "medium":
      return "secondary";
    case "high":
      return "default";
    case "critical":
      return "destructive";
    default:
      return "outline";
  }
}

// Custom styles for scrollbars and other elements
const globalStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(155, 155, 155, 0.5);
    border-radius: 20px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(155, 155, 155, 0.7);
  }
  
  @media (max-width: 768px) {
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
      height: 4px;
    }
  }
  
  .required:after {
    content: " *";
    color: rgb(239, 68, 68);
  }
`;

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
  const [selectedGrievance, setSelectedGrievance] = useState<any | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState({
    open: false,
    status: '' as GrievanceStatus,
    comment: ''
  });
  
  // Sample data for the grievances
  const sampleGrievances = [
    {
      id: "g1234567890",
      title: "Salary discrepancy in recent paycheck",
      description: "I noticed that my recent paycheck didn't include the overtime hours I worked last month. I worked an additional 15 hours but they weren't reflected in my compensation.",
      status: "Pending",
      priority: "High",
      category: "Financial",
      department: "Finance",
      createdAt: "2023-04-15T10:30:00Z",
      updatedAt: "2023-04-15T10:30:00Z",
      submittedBy: {
        id: "u1",
        name: "John Smith",
        avatar: "/avatars/john-smith.png",
      },
      assignedTo: null,
      comments: [],
      statusHistory: [
        {
          status: "Pending",
          timestamp: "2023-04-15T10:30:00Z",
          comment: "Initial submission",
          updatedBy: {
            id: "u1",
            name: "John Smith",
            avatar: "/avatars/john-smith.png",
          },
        },
      ],
      attachments: [
        { name: "pay-stub-march.pdf", url: "/files/pay-stub-march.pdf" },
      ],
    },
    {
      id: "g2345678901",
      title: "Request for better equipment",
      description: "My current laptop is very slow and has battery issues. It's affecting my productivity and making it difficult to complete tasks efficiently. I would like to request a new laptop with better specifications.",
      status: "In Review",
      priority: "Medium",
      category: "Technical",
      department: "IT",
      createdAt: "2023-04-10T14:20:00Z",
      updatedAt: "2023-04-11T09:15:00Z",
      submittedBy: {
        id: "u2",
        name: "Sarah Johnson",
        avatar: "/avatars/sarah-johnson.png",
      },
      assignedTo: {
        id: "u3",
        name: "Mike Peterson",
        avatar: "/avatars/mike-peterson.png",
      },
      comments: [
        {
          id: "c1",
          content: "We'll check the inventory and get back to you by the end of the week.",
          timestamp: "2023-04-11T09:15:00Z",
          user: {
            id: "u3",
            name: "Mike Peterson",
            avatar: "/avatars/mike-peterson.png",
          },
        },
        {
          id: "c2",
          content: "Thank you for looking into this. My current laptop shuts down unexpectedly during meetings.",
          timestamp: "2023-04-11T10:20:00Z",
          user: {
            id: "u2",
            name: "Sarah Johnson",
            avatar: "/avatars/sarah-johnson.png",
          },
        },
      ],
      statusHistory: [
        {
          status: "Pending",
          timestamp: "2023-04-10T14:20:00Z",
          comment: "Initial submission",
          updatedBy: {
            id: "u2",
            name: "Sarah Johnson",
            avatar: "/avatars/sarah-johnson.png",
          },
        },
        {
          status: "In Review",
          timestamp: "2023-04-11T09:10:00Z",
          comment: "Assigned to IT department for review",
          updatedBy: {
            id: "u3",
            name: "Mike Peterson",
            avatar: "/avatars/mike-peterson.png",
          },
        },
      ],
      attachments: [],
    },
    {
      id: "g3456789012",
      title: "Harassment complaint against team lead",
      description: "I would like to report inappropriate behavior from my team lead. There have been multiple instances of verbal harassment and unfair treatment during team meetings and in private conversations.",
      status: "Escalated",
      priority: "Critical",
      category: "HR",
      department: "HR",
      createdAt: "2023-04-05T11:45:00Z",
      updatedAt: "2023-04-07T16:15:00Z",
      submittedBy: {
        id: "u4",
        name: "David Wilson",
        avatar: "/avatars/david-wilson.png",
      },
      assignedTo: {
        id: "u5",
        name: "Jennifer Lee",
        avatar: "/avatars/jennifer-lee.png",
      },
      comments: [
        {
          id: "c3",
          content: "This is a serious matter. We'd like to schedule a confidential meeting to discuss the details further.",
          timestamp: "2023-04-06T13:30:00Z",
          user: {
            id: "u5",
            name: "Jennifer Lee",
            avatar: "/avatars/jennifer-lee.png",
          },
        },
      ],
      statusHistory: [
        {
          status: "Pending",
          timestamp: "2023-04-05T11:45:00Z",
          comment: "Initial submission",
          updatedBy: {
            id: "u4",
            name: "David Wilson",
            avatar: "/avatars/david-wilson.png",
          },
        },
        {
          status: "In Review",
          timestamp: "2023-04-06T09:20:00Z",
          comment: "Assigned to HR for initial review",
          updatedBy: {
            id: "u5",
            name: "Jennifer Lee",
            avatar: "/avatars/jennifer-lee.png",
          },
        },
        {
          status: "Escalated",
          timestamp: "2023-04-07T16:15:00Z",
          comment: "Escalated to senior management due to severity",
          updatedBy: {
            id: "u5",
            name: "Jennifer Lee",
            avatar: "/avatars/jennifer-lee.png",
          },
        },
      ],
      attachments: [
        { name: "incident-log.docx", url: "/files/incident-log.docx" },
        { name: "email-screenshot.png", url: "/files/email-screenshot.png" },
      ],
    },
    {
      id: "g4567890123",
      title: "Request for flexible working hours",
      description: "Due to my childcare responsibilities, I would like to request flexible working hours. I propose starting at 7:30 AM and finishing at 4:00 PM instead of the standard 9-5:30 schedule.",
      status: "Resolved",
      priority: "Low",
      category: "HR",
      department: "HR",
      createdAt: "2023-03-20T09:00:00Z",
      updatedAt: "2023-03-25T14:30:00Z",
      submittedBy: {
        id: "u6",
        name: "Emily Brown",
        avatar: "/avatars/emily-brown.png",
      },
      assignedTo: {
        id: "u5",
        name: "Jennifer Lee",
        avatar: "/avatars/jennifer-lee.png",
      },
      comments: [
        {
          id: "c4",
          content: "We'll review your request and discuss it with your department manager.",
          timestamp: "2023-03-21T11:05:00Z",
          user: {
            id: "u5",
            name: "Jennifer Lee",
            avatar: "/avatars/jennifer-lee.png",
          },
        },
        {
          id: "c5",
          content: "Your request has been approved. Please coordinate with your team to ensure all meetings and collaborative work are scheduled appropriately.",
          timestamp: "2023-03-25T14:30:00Z",
          user: {
            id: "u5",
            name: "Jennifer Lee",
            avatar: "/avatars/jennifer-lee.png",
          },
        },
        {
          id: "c6",
          content: "Thank you for approving my request. I will make sure to coordinate with my team members.",
          timestamp: "2023-03-25T15:45:00Z",
          user: {
            id: "u6",
            name: "Emily Brown",
            avatar: "/avatars/emily-brown.png",
          },
        },
      ],
      statusHistory: [
        {
          status: "Pending",
          timestamp: "2023-03-20T09:00:00Z",
          comment: "Initial submission",
          updatedBy: {
            id: "u6",
            name: "Emily Brown",
            avatar: "/avatars/emily-brown.png",
          },
        },
        {
          status: "In Review",
          timestamp: "2023-03-21T11:00:00Z",
          comment: "Under review by HR",
          updatedBy: {
            id: "u5",
            name: "Jennifer Lee",
            avatar: "/avatars/jennifer-lee.png",
          },
        },
        {
          status: "Resolved",
          timestamp: "2023-03-25T14:25:00Z",
          comment: "Request approved",
          updatedBy: {
            id: "u5",
            name: "Jennifer Lee",
            avatar: "/avatars/jennifer-lee.png",
          },
        },
      ],
      attachments: [],
    },
  ];

  // Filter and sort grievances based on active tab, search, and filters
  const filteredGrievances = sampleGrievances.filter((grievance) => {
    // Filter by tab
    if (activeTab === "my-grievances" && grievance.submittedBy.id !== "u1") return false;
    if (activeTab === "assigned" && (!grievance.assignedTo || grievance.assignedTo.id !== "u1")) return false;
    if (activeTab === "unassigned" && grievance.assignedTo) return false;
    
    // Filter by search query
    if (searchQuery && !grievance.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    // Filter by status
    if (statusFilter !== 'all' && grievance.status !== statusFilter) return false;
    
    // Filter by priority
    if (priorityFilter !== 'all' && grievance.priority !== priorityFilter) return false;
    
    // Filter by category
    if (categoryFilter !== 'all' && grievance.category !== categoryFilter) return false;
    
    // Filter by department
    if (departmentFilter !== 'all' && grievance.department !== departmentFilter) return false;
    
    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Get currently selected grievance
  const currentGrievance = selectedGrievance 
    ? sampleGrievances.find(g => g.id === selectedGrievance) 
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

  // Apply the custom styles to the head
  useEffect(() => {
    // Create a style element
    const styleElement = document.createElement('style');
    styleElement.innerHTML = globalStyles;
    
    // Append it to the head
    document.head.appendChild(styleElement);
    
    // Cleanup function to remove the style element when component unmounts
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <>
      <DashboardShell className="overflow-hidden relative bg-muted/5 dark:bg-muted/10 px-0 py-0">
        <div className="flex flex-col h-full">
          {/* Header Section */}
          <div className="bg-background sticky top-0 z-10 border-b px-8 py-4">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Grievances & Redressal</h1>
                  <p className="text-muted-foreground mt-1">
                    Manage employee grievances and track their resolution progress
                  </p>
                </div>
                <Button onClick={() => setNewGrievanceOpen(true)} className="md:self-start w-full md:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Submit Grievance
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex gap-2 w-full max-w-sm">
                  <Input
                    placeholder="Search grievances..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                  <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="w-full sm:w-auto flex-1 overflow-hidden">
                  <div className="border-b border-gray-200 dark:border-gray-800 flex">
                    <button 
                      className={`px-6 py-3 border-b-2 transition-colors ${activeTab === 'all' ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                      onClick={() => setActiveTab('all')}
                    >
                      All
                    </button>
                    <button 
                      className={`px-6 py-3 border-b-2 transition-colors ${activeTab === 'my-grievances' ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                      onClick={() => setActiveTab('my-grievances')}
                    >
                      My Grievances
                    </button>
                    <button 
                      className={`px-6 py-3 border-b-2 transition-colors ${activeTab === 'assigned' ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                      onClick={() => setActiveTab('assigned')}
                    >
                      Assigned to Me
                    </button>
                    <button 
                      className={`px-6 py-3 border-b-2 transition-colors ${activeTab === 'unassigned' ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                      onClick={() => setActiveTab('unassigned')}
                    >
                      Unassigned
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Content Section */}
          <div className="flex-1 px-8 py-6 overflow-auto custom-scrollbar">
            {showFilters && (
              <div className="bg-card rounded-lg p-4 mb-6 border shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        <SelectItem value="all">All</SelectItem>
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
                        <SelectItem value="all">All</SelectItem>
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
                        <SelectItem value="all">All</SelectItem>
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
                      onValueChange={(value) => setDepartmentFilter(value)}
                    >
                      <SelectTrigger id="department-filter">
                        <SelectValue placeholder="Filter by department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStatusFilter('all');
                      setPriorityFilter('all');
                      setCategoryFilter('all');
                      setDepartmentFilter('all');
                    }}
                    className="mr-2"
                  >
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowFilters(false)}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            )}
            
            <div className="mt-6">
              {filteredGrievances.length === 0 ? (
                <div className="bg-card rounded-lg p-8 text-center border">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-xl font-semibold mb-2">No grievances found</p>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {activeTab === 'my-grievances'
                      ? "You haven't submitted any grievances yet."
                      : activeTab === 'assigned'
                      ? "No grievances are currently assigned to you."
                      : activeTab === 'unassigned'
                      ? "There are no unassigned grievances at the moment."
                      : "No grievances match your current filters."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 pb-4">
                  {filteredGrievances.map((grievance) => (
                    <div 
                      key={grievance.id} 
                      className="bg-card rounded-lg border border-gray-200 dark:border-gray-800"
                    >
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-0 sm:justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-medium mb-1 line-clamp-1">{grievance.title}</h3>
                            <div className="text-sm text-muted-foreground mb-3">
                              {grievance.submittedBy.name} • {grievance.department} • 
                              {formatDistanceToNow(new Date(grievance.createdAt), { addSuffix: true })}
                            </div>
                            <p className="text-sm line-clamp-2 mb-4">{grievance.description}</p>
                            
                            <div className="flex flex-wrap items-center gap-3">
                              <Badge variant="outline">
                                {grievance.category.charAt(0).toUpperCase() + grievance.category.slice(1)}
                              </Badge>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <MessageCircle className="mr-1 h-4 w-4" />
                                <span>{grievance.comments.length}</span>
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Clock className="mr-1 h-4 w-4" />
                                <span className="whitespace-nowrap">Updated {formatDistanceToNow(new Date(grievance.updatedAt), { addSuffix: true })}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex sm:flex-col items-start sm:items-end gap-2 sm:ml-4">
                            <Badge className="bg-muted/50 text-foreground">
                              {grievance.status.charAt(0).toUpperCase() + grievance.status.slice(1).replace('-', ' ')}
                            </Badge>
                            <Badge className="bg-muted/50 text-foreground">
                              {grievance.priority.charAt(0).toUpperCase() + grievance.priority.slice(1)}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                          <div>
                            {grievance.assignedTo ? (
                              <div className="flex items-center text-sm">
                                <span className="text-muted-foreground mr-2">Assigned to:</span>
                                <Avatar className="h-6 w-6 mr-1">
                                  <AvatarFallback>{grievance.assignedTo.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{grievance.assignedTo.name}</span>
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
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            View Details
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardShell>
      
      {/* New Grievance Dialog */}
      <Dialog open={newGrievanceOpen} onOpenChange={setNewGrievanceOpen}>
        <DialogContent className="sm:max-w-lg md:max-w-xl max-h-[85vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle>Submit New Grievance</DialogTitle>
            <DialogDescription>
              Fill out the form below to submit a new grievance. All fields marked with an asterisk (*) are required.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="required">Title</Label>
                <Input id="title" placeholder="Brief summary of your grievance" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="required">Category</Label>
                  <Select>
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
                
                <div className="space-y-2">
                  <Label htmlFor="priority" className="required">Priority</Label>
                  <Select>
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department" className="required">Related Department</Label>
                <Select>
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="required">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about your grievance"
                  className="min-h-[150px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="attachments">Attachments</Label>
                <div className="border border-input bg-background rounded-md px-3 py-2">
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/40 hover:bg-muted/60"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="h-6 w-6 text-muted-foreground mb-2" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, DOC, PNG, JPG (MAX 5MB)
                        </p>
                      </div>
                      <input id="file-upload" type="file" className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewGrievanceOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Submit Grievance</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Grievance Detail Dialog */}
      <Dialog open={selectedGrievance !== null} onOpenChange={(open) => !open && setSelectedGrievance(null)}>
        <DialogContent className="sm:max-w-lg md:max-w-2xl lg:max-w-4xl max-h-[85vh] overflow-y-auto custom-scrollbar p-0">
          {selectedGrievance && (
            <>
              <div className="sticky top-0 z-10 bg-background pt-4 px-6">
                <div className="flex justify-between items-start mb-2">
                  <DialogTitle className="text-xl">{selectedGrievance.title}</DialogTitle>
                  <button className="h-6 w-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant={getPriorityVariant(selectedGrievance.priority)}>
                    {selectedGrievance.priority}
                  </Badge>
                  <Badge variant="outline">{selectedGrievance.category}</Badge>
                  <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${selectedGrievance.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500' : ''}
                    ${selectedGrievance.status === 'In Review' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500' : ''}
                    ${selectedGrievance.status === 'Escalated' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500' : ''}
                    ${selectedGrievance.status === 'Resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500' : ''}
                    ${selectedGrievance.status === 'Rejected' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-500' : ''}
                  `}>
                    {selectedGrievance.status}
                  </div>
                  <span className="text-xs text-muted-foreground px-2.5 py-0.5 bg-muted rounded-full">
                    ID: {selectedGrievance.id.slice(0, 8)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between pb-4 border-b">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={selectedGrievance.submittedBy.avatar} alt={selectedGrievance.submittedBy.name} />
                      <AvatarFallback>{getInitials(selectedGrievance.submittedBy.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{selectedGrievance.submittedBy.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Submitted on {formatDate(new Date(selectedGrievance.createdAt))}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {selectedGrievance.status !== 'Resolved' && selectedGrievance.status !== 'Rejected' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Activity className="mr-2 h-4 w-4" />
                            Update Status
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Mark as In Review</DropdownMenuItem>
                          <DropdownMenuItem>Escalate</DropdownMenuItem>
                          <DropdownMenuItem>Mark as Resolved</DropdownMenuItem>
                          <DropdownMenuItem>Reject</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <UserCircle className="mr-2 h-4 w-4" />
                          Assign
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4">
                <div className="space-y-6">
                  {/* Description Section */}
                  <div>
                    <h3 className="text-base font-medium mb-2">Description</h3>
                    <div className="bg-muted/30 rounded-lg p-4 text-sm">
                      {selectedGrievance.description}
                    </div>
                    
                    {selectedGrievance.attachments && selectedGrievance.attachments.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Attachments</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedGrievance.attachments.map((attachment, i) => (
                            <div key={i} className="flex items-center gap-1 bg-muted/50 rounded px-2 py-1 text-xs">
                              <FileText className="h-3 w-3" />
                              <span>{attachment.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Status History Section */}
                  <div>
                    <h3 className="text-base font-medium mb-2">Status History</h3>
                    <div className="space-y-3">
                      {selectedGrievance.statusHistory.map((status, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <div className={`h-4 w-4 rounded-full flex items-center justify-center
                              ${status.status === 'Pending' ? 'bg-yellow-500' : ''}
                              ${status.status === 'In Review' ? 'bg-blue-500' : ''}
                              ${status.status === 'Escalated' ? 'bg-red-500' : ''}
                              ${status.status === 'Resolved' ? 'bg-green-500' : ''}
                              ${status.status === 'Rejected' ? 'bg-gray-500' : ''}
                            `}></div>
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                              <p className="font-medium text-sm">{status.status}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(new Date(status.timestamp))}</p>
                            </div>
                            {status.comment && (
                              <p className="text-sm mt-1">{status.comment}</p>
                            )}
                            {status.updatedBy && (
                              <div className="flex items-center mt-1">
                                <Avatar className="h-4 w-4 mr-1">
                                  <AvatarImage src={status.updatedBy.avatar} alt={status.updatedBy.name} />
                                  <AvatarFallback>{getInitials(status.updatedBy.name)}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">{status.updatedBy.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Comments Section */}
                  <div>
                    <h3 className="text-base font-medium mb-3">Comments</h3>
                    <div className="space-y-4">
                      {selectedGrievance.comments.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No comments yet.</p>
                      ) : (
                        selectedGrievance.comments.map((comment, i) => (
                          <div key={i} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
                              <AvatarFallback>{getInitials(comment.user.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-muted/30 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-sm">{comment.user.name}</span>
                                  <span className="text-xs text-muted-foreground">{formatDate(new Date(comment.timestamp))}</span>
                                </div>
                                <p className="text-sm">{comment.content}</p>
                              </div>
                              
                              <div className="flex items-center gap-4 mt-1">
                                <button className="text-xs text-muted-foreground hover:text-foreground">Reply</button>
                                <button className="text-xs text-muted-foreground hover:text-foreground">Report</button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      
                      <div className="pt-4 border-t mt-4">
                        <div className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/avatars/current-user.png" alt="Current User" />
                            <AvatarFallback>CU</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <Textarea
                              placeholder="Add a comment..."
                              className="min-h-[100px]"
                            />
                            <div className="flex justify-end mt-2">
                              <Button size="sm">Post Comment</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
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
          <div className="grid gap-4 py-2">
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
          <DialogFooter className="gap-2 sm:gap-0">
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