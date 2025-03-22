import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { 
  Search, 
  Download, 
  Filter, 
  ChevronDown, 
  MoreHorizontal, 
  Eye, 
  History, 
  Clock,
  AlertTriangle,
  FileText,
  User
} from "lucide-react";
import { useAudit, AuditLog, AuditActionType, AuditEntityType } from "@/components/AuditProvider";
import { toast } from "@/hooks/use-toast";

// Helper function to format timestamps
const formatTimestamp = (timestamp: string): string => {
  try {
    return format(parseISO(timestamp), "MMM dd, yyyy HH:mm:ss");
  } catch (e) {
    return timestamp;
  }
};

// Helper function to get color for action type
const getActionColor = (actionType: AuditActionType): string => {
  switch (actionType) {
    case 'create':
      return 'bg-green-100 text-green-800';
    case 'update':
      return 'bg-blue-100 text-blue-800';
    case 'delete':
      return 'bg-red-100 text-red-800';
    case 'approve':
      return 'bg-purple-100 text-purple-800';
    case 'reject':
      return 'bg-orange-100 text-orange-800';
    case 'login':
    case 'logout':
      return 'bg-gray-100 text-gray-800';
    case 'view':
      return 'bg-yellow-100 text-yellow-800';
    case 'escalate':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Helper function to get color for entity type
const getEntityIcon = (entityType: AuditEntityType) => {
  switch (entityType) {
    case 'user':
      return <User className="h-4 w-4" />;
    case 'document':
      return <FileText className="h-4 w-4" />;
    case 'task':
      return <Clock className="h-4 w-4" />;
    case 'grievance':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return null;
  }
};

const AuditLogs = () => {
  const { getSystemAuditLogs, getLogsByEntity } = useAudit();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Check if user has admin privileges
  useEffect(() => {
    if (!user) return;
    
    if (user.role !== 'admin' && user.role !== 'manager') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the audit logs.",
        variant: "destructive"
      });
      navigate('/', { replace: true });
    }
  }, [user, navigate]);
  
  // If user doesn't have permission, don't render anything
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return null;
  }
  
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedEntity, setSelectedEntity] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  // Get all logs
  const allLogs = getSystemAuditLogs();
  
  // Count logs for each tab
  const userLogsCount = allLogs.filter(log => log.entityType === "user").length;
  const documentLogsCount = allLogs.filter(log => log.entityType === "document").length;
  const systemLogsCount = allLogs.filter(log => ["login", "logout", "system"].includes(log.entityType)).length;

  // Filter logs based on user selections
  const filteredLogs = allLogs.filter(log => {
    // Filter by tab first
    if (activeTab === "user" && log.entityType !== "user") return false;
    if (activeTab === "documents" && log.entityType !== "document") return false;
    if (activeTab === "system" && !["login", "logout", "system"].includes(log.entityType)) return false;
    
    // Then filter by search query
    const matchesSearch = 
      searchQuery === "" || 
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.entityName && log.entityName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by action type
    const matchesAction = 
      selectedAction === "all" || 
      log.actionType === selectedAction;
    
    // Filter by entity type
    const matchesEntity = 
      selectedEntity === "all" || 
      log.entityType === selectedEntity;
    
    // Filter by department
    const matchesDepartment = 
      selectedDepartment === "all" || 
      log.department === selectedDepartment;
    
    return matchesSearch && matchesAction && matchesEntity && matchesDepartment;
  });

  // Get unique departments for the filter dropdown
  const departments = Array.from(new Set(allLogs.map(log => log.department).filter(Boolean))) as string[];
  
  // Pagination
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedAction, selectedEntity, selectedDepartment, activeTab]);

  // Handle log detail view
  const handleViewLogDetails = (log: AuditLog) => {
    toast({
      title: `Log Details: ${log.actionType} ${log.entityType}`,
      description: `Performed by ${log.userName} on ${formatTimestamp(log.timestamp)}`,
    });
  };

  // Handle export logs
  const handleExportLogs = () => {
    toast({
      title: "Logs Exported",
      description: "Audit logs have been exported successfully",
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">
            Track all system activities and changes for transparency and accountability
          </p>
        </div>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={handleExportLogs}
        >
          <Download size={16} />
          Export Logs
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
          <TabsTrigger value="all">All Logs <Badge variant="outline" className="ml-2">{allLogs.length}</Badge></TabsTrigger>
          <TabsTrigger value="user">User Activity <Badge variant="outline" className="ml-2">{userLogsCount}</Badge></TabsTrigger>
          <TabsTrigger value="documents">Document Changes <Badge variant="outline" className="ml-2">{documentLogsCount}</Badge></TabsTrigger>
          <TabsTrigger value="system">System Events <Badge variant="outline" className="ml-2">{systemLogsCount}</Badge></TabsTrigger>
        </TabsList>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {activeTab === "all" && "All System Audit Logs"}
              {activeTab === "user" && "User Activity Logs"}
              {activeTab === "documents" && "Document Change History"}
              {activeTab === "system" && "System Events & Logins"}
            </CardTitle>
            <CardDescription>
              {activeTab === "all" && "Complete audit trail of all system activities"}
              {activeTab === "user" && "Track user logins, profile changes, and account activities"}
              {activeTab === "documents" && "Monitor document uploads, edits, and access events"}
              {activeTab === "system" && "System-level events including logins, logouts, and configuration changes"}
            </CardDescription>
            
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mt-4">
              <div className="relative flex w-full max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search logs..."
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Action Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="view">View</SelectItem>
                    <SelectItem value="approve">Approve</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="logout">Logout</SelectItem>
                    <SelectItem value="escalate">Escalate</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Entity Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entities</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="grievance">Grievance</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentLogs.length > 0 ? (
                    currentLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {formatTimestamp(log.timestamp)}
                        </TableCell>
                        <TableCell>{log.userName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${getActionColor(log.actionType as AuditActionType)}`}>
                            {log.actionType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getEntityIcon(log.entityType as AuditEntityType)}
                            <span>{log.entityName || log.entityType}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {log.details}
                        </TableCell>
                        <TableCell>{log.department}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewLogDetails(log)}>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>View Details</span>
                              </DropdownMenuItem>
                              {log.changes && log.changes.length > 0 && (
                                <DropdownMenuItem>
                                  <History className="mr-2 h-4 w-4" />
                                  <span>View Changes</span>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        No logs found matching your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          
          {filteredLogs.length > logsPerPage && (
            <CardFooter className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {indexOfFirstLog + 1}-{Math.min(indexOfLastLog, filteredLogs.length)} of {filteredLogs.length} logs
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </Tabs>
    </div>
  );
};

export { AuditLogs }; 