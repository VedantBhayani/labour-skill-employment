import React, { createContext, useState, useContext, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { useAuth } from './AuthProvider';
import { useAudit } from './AuditProvider';
import { toast } from "@/hooks/use-toast";

// Define types
export type GrievanceStatus = 'pending' | 'in-review' | 'escalated' | 'resolved' | 'rejected';
export type GrievancePriority = 'low' | 'medium' | 'high' | 'critical';
export type GrievanceCategory = 'hr' | 'technical' | 'management' | 'financial' | 'infrastructure' | 'other';

export interface StatusUpdate {
  id: string;
  timestamp: string;
  status: GrievanceStatus;
  comment: string;
  updatedBy: string;
  updatedByName: string;
}

export interface Grievance {
  id: string;
  title: string;
  description: string;
  category: GrievanceCategory;
  department: string;
  status: GrievanceStatus;
  priority: GrievancePriority;
  createdBy: string;
  createdByName: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  isAnonymous: boolean;
  attachments?: string[];
  statusHistory: StatusUpdate[];
  comments: {
    id: string;
    text: string;
    createdBy: string;
    createdByName: string;
    createdAt: string;
    isInternal: boolean;
  }[];
}

interface GrievanceContextType {
  grievances: Grievance[];
  addGrievance: (grievance: Omit<Grievance, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory' | 'comments'>) => Grievance;
  updateGrievanceStatus: (id: string, status: GrievanceStatus, comment: string) => boolean;
  assignGrievance: (id: string, assignedTo: string, assignedToName: string) => boolean;
  addComment: (id: string, text: string, isInternal: boolean) => boolean;
  escalateGrievance: (id: string, reason: string) => boolean;
  resolveGrievance: (id: string, resolution: string) => boolean;
  getGrievanceById: (id: string) => Grievance | undefined;
  getGrievancesByUser: (userId: string) => Grievance[];
  getGrievancesByDepartment: (department: string) => Grievance[];
  getGrievancesByStatus: (status: GrievanceStatus) => Grievance[];
}

// Sample initial grievances for demonstration
const INITIAL_GRIEVANCES: Grievance[] = [
  {
    id: 'g1',
    title: 'Network connectivity issues in HR department',
    description: 'The network in the HR department has been extremely slow for the past week, affecting productivity.',
    category: 'technical',
    department: 'HR',
    status: 'in-review',
    priority: 'high',
    createdBy: 'user4',
    createdByName: 'Employee User',
    assignedTo: 'user3',
    assignedToName: 'Manager User',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    dueDate: new Date(Date.now() + 3600000 * 48).toISOString(),
    isAnonymous: false,
    statusHistory: [
      {
        id: 'sh1',
        timestamp: new Date(Date.now() - 3600000 * 72).toISOString(),
        status: 'pending',
        comment: 'Grievance submitted',
        updatedBy: 'user4',
        updatedByName: 'Employee User'
      },
      {
        id: 'sh2',
        timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
        status: 'in-review',
        comment: 'Assigned to IT department for investigation',
        updatedBy: 'user3',
        updatedByName: 'Manager User'
      }
    ],
    comments: [
      {
        id: 'c1',
        text: 'IT team is investigating the issue. We suspect it might be related to the recent router upgrade.',
        createdBy: 'user3',
        createdByName: 'Manager User',
        createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
        isInternal: true
      },
      {
        id: 'c2',
        text: 'The problem seems to be getting worse. Can we expedite this?',
        createdBy: 'user4',
        createdByName: 'Employee User',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        isInternal: false
      }
    ]
  },
  {
    id: 'g2',
    title: 'Inappropriate behavior from team lead',
    description: 'I would like to report inappropriate behavior from my team lead during team meetings.',
    category: 'hr',
    department: 'Development',
    status: 'escalated',
    priority: 'critical',
    createdBy: 'user4',
    createdByName: 'Employee User',
    assignedTo: 'user1',
    assignedToName: 'Admin User',
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    dueDate: new Date(Date.now() + 3600000 * 24).toISOString(),
    isAnonymous: true,
    statusHistory: [
      {
        id: 'sh3',
        timestamp: new Date(Date.now() - 3600000 * 120).toISOString(),
        status: 'pending',
        comment: 'Grievance submitted',
        updatedBy: 'user4',
        updatedByName: 'Anonymous'
      },
      {
        id: 'sh4',
        timestamp: new Date(Date.now() - 3600000 * 96).toISOString(),
        status: 'in-review',
        comment: 'HR is reviewing the complaint',
        updatedBy: 'user2',
        updatedByName: 'Department Head'
      },
      {
        id: 'sh5',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        status: 'escalated',
        comment: 'Escalated to senior management due to severity',
        updatedBy: 'user2',
        updatedByName: 'Department Head'
      }
    ],
    comments: [
      {
        id: 'c3',
        text: 'We need to schedule interviews with team members to gather more information.',
        createdBy: 'user2',
        createdByName: 'Department Head',
        createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
        isInternal: true
      },
      {
        id: 'c4',
        text: 'This is a sensitive matter. Lets handle it with strict confidentiality.',
        createdBy: 'user1',
        createdByName: 'Admin User',
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        isInternal: true
      }
    ]
  },
  {
    id: 'g3',
    title: 'Delay in expense reimbursement',
    description: 'My expense reimbursement from the client visit last month has not been processed yet.',
    category: 'financial',
    department: 'Finance',
    status: 'resolved',
    priority: 'medium',
    createdBy: 'user3',
    createdByName: 'Manager User',
    assignedTo: 'user2',
    assignedToName: 'Department Head',
    createdAt: new Date(Date.now() - 3600000 * 168).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    isAnonymous: false,
    statusHistory: [
      {
        id: 'sh6',
        timestamp: new Date(Date.now() - 3600000 * 168).toISOString(),
        status: 'pending',
        comment: 'Grievance submitted',
        updatedBy: 'user3',
        updatedByName: 'Manager User'
      },
      {
        id: 'sh7',
        timestamp: new Date(Date.now() - 3600000 * 144).toISOString(),
        status: 'in-review',
        comment: 'Finance department is reviewing',
        updatedBy: 'user2',
        updatedByName: 'Department Head'
      },
      {
        id: 'sh8',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        status: 'resolved',
        comment: 'Reimbursement processed and payment initiated',
        updatedBy: 'user2',
        updatedByName: 'Department Head'
      }
    ],
    comments: [
      {
        id: 'c5',
        text: 'We found your expense report in the backlog. Processing it now.',
        createdBy: 'user2',
        createdByName: 'Department Head',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        isInternal: false
      },
      {
        id: 'c6',
        text: 'The reimbursement has been approved and will be in your next paycheck.',
        createdBy: 'user2',
        createdByName: 'Department Head',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        isInternal: false
      }
    ]
  }
];

const GrievanceContext = createContext<GrievanceContextType | undefined>(undefined);

export const GrievanceProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [grievances, setGrievances] = useState<Grievance[]>(INITIAL_GRIEVANCES);
  const { user } = useAuth();
  const { addAuditLog } = useAudit();

  // Add new grievance
  const addGrievance = (grievanceData: Omit<Grievance, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory' | 'comments'>): Grievance => {
    const now = new Date().toISOString();
    const newGrievance: Grievance = {
      id: uuidv4(),
      ...grievanceData,
      createdAt: now,
      updatedAt: now,
      statusHistory: [
        {
          id: uuidv4(),
          timestamp: now,
          status: 'pending',
          comment: 'Grievance submitted',
          updatedBy: grievanceData.createdBy,
          updatedByName: grievanceData.isAnonymous ? 'Anonymous' : grievanceData.createdByName
        }
      ],
      comments: []
    };

    setGrievances(prev => [newGrievance, ...prev]);
    
    // Add audit log
    addAuditLog(
      'create',
      'grievance',
      newGrievance.id,
      newGrievance.title,
      `New grievance submitted: ${newGrievance.title}`
    );
    
    // Show toast notification
    toast({
      title: "Grievance Submitted",
      description: "Your grievance has been submitted successfully",
    });
    
    return newGrievance;
  };

  // Update grievance status
  const updateGrievanceStatus = (id: string, status: GrievanceStatus, comment: string): boolean => {
    const grievanceIndex = grievances.findIndex(g => g.id === id);
    if (grievanceIndex === -1 || !user) return false;

    const now = new Date().toISOString();
    const updatedGrievance = { ...grievances[grievanceIndex] };
    
    // Create status update
    const statusUpdate: StatusUpdate = {
      id: uuidv4(),
      timestamp: now,
      status,
      comment,
      updatedBy: user.id,
      updatedByName: user.name
    };
    
    // Update the grievance
    updatedGrievance.status = status;
    updatedGrievance.updatedAt = now;
    updatedGrievance.statusHistory = [...updatedGrievance.statusHistory, statusUpdate];
    
    // Update state
    const updatedGrievances = [...grievances];
    updatedGrievances[grievanceIndex] = updatedGrievance;
    setGrievances(updatedGrievances);
    
    // Add audit log
    addAuditLog(
      'update',
      'grievance',
      id,
      updatedGrievance.title,
      `Grievance status updated to ${status}`,
      [{ field: 'status', oldValue: grievances[grievanceIndex].status, newValue: status }]
    );
    
    // Show toast notification
    toast({
      title: "Status Updated",
      description: `Grievance status updated to ${status}`,
    });
    
    return true;
  };

  // Assign grievance to user
  const assignGrievance = (id: string, assignedTo: string, assignedToName: string): boolean => {
    const grievanceIndex = grievances.findIndex(g => g.id === id);
    if (grievanceIndex === -1 || !user) return false;

    const now = new Date().toISOString();
    const updatedGrievance = { ...grievances[grievanceIndex] };
    
    // Update assignment
    updatedGrievance.assignedTo = assignedTo;
    updatedGrievance.assignedToName = assignedToName;
    updatedGrievance.updatedAt = now;
    
    // Create status update if status is pending
    if (updatedGrievance.status === 'pending') {
      const statusUpdate: StatusUpdate = {
        id: uuidv4(),
        timestamp: now,
        status: 'in-review',
        comment: `Assigned to ${assignedToName} for review`,
        updatedBy: user.id,
        updatedByName: user.name
      };
      
      updatedGrievance.status = 'in-review';
      updatedGrievance.statusHistory = [...updatedGrievance.statusHistory, statusUpdate];
    }
    
    // Update state
    const updatedGrievances = [...grievances];
    updatedGrievances[grievanceIndex] = updatedGrievance;
    setGrievances(updatedGrievances);
    
    // Add audit log
    addAuditLog(
      'assign',
      'grievance',
      id,
      updatedGrievance.title,
      `Grievance assigned to ${assignedToName}`,
      [{ field: 'assignedTo', oldValue: grievances[grievanceIndex].assignedToName || 'None', newValue: assignedToName }]
    );
    
    // Show toast notification
    toast({
      title: "Grievance Assigned",
      description: `Grievance assigned to ${assignedToName}`,
    });
    
    return true;
  };

  // Add comment to grievance
  const addComment = (id: string, text: string, isInternal: boolean): boolean => {
    const grievanceIndex = grievances.findIndex(g => g.id === id);
    if (grievanceIndex === -1 || !user) return false;

    const now = new Date().toISOString();
    const updatedGrievance = { ...grievances[grievanceIndex] };
    
    // Create new comment
    const newComment = {
      id: uuidv4(),
      text,
      createdBy: user.id,
      createdByName: user.name,
      createdAt: now,
      isInternal
    };
    
    // Update the grievance
    updatedGrievance.comments = [...updatedGrievance.comments, newComment];
    updatedGrievance.updatedAt = now;
    
    // Update state
    const updatedGrievances = [...grievances];
    updatedGrievances[grievanceIndex] = updatedGrievance;
    setGrievances(updatedGrievances);
    
    // Add audit log
    addAuditLog(
      'update',
      'grievance',
      id,
      updatedGrievance.title,
      `Comment added to grievance`,
    );
    
    // Show toast notification
    toast({
      title: "Comment Added",
      description: isInternal ? "Internal comment added" : "Comment added and visible to the reporter",
    });
    
    return true;
  };

  // Escalate grievance
  const escalateGrievance = (id: string, reason: string): boolean => {
    const grievanceIndex = grievances.findIndex(g => g.id === id);
    if (grievanceIndex === -1 || !user) return false;

    const now = new Date().toISOString();
    const updatedGrievance = { ...grievances[grievanceIndex] };
    
    // Create status update
    const statusUpdate: StatusUpdate = {
      id: uuidv4(),
      timestamp: now,
      status: 'escalated',
      comment: `Escalated: ${reason}`,
      updatedBy: user.id,
      updatedByName: user.name
    };
    
    // Update the grievance
    updatedGrievance.status = 'escalated';
    updatedGrievance.updatedAt = now;
    updatedGrievance.statusHistory = [...updatedGrievance.statusHistory, statusUpdate];
    
    // Update assignment to admin if exists
    if (!updatedGrievance.assignedTo || updatedGrievance.assignedTo !== 'user1') {
      updatedGrievance.assignedTo = 'user1';
      updatedGrievance.assignedToName = 'Admin User';
    }
    
    // Update state
    const updatedGrievances = [...grievances];
    updatedGrievances[grievanceIndex] = updatedGrievance;
    setGrievances(updatedGrievances);
    
    // Add audit log
    addAuditLog(
      'escalate',
      'grievance',
      id,
      updatedGrievance.title,
      `Grievance escalated: ${reason}`,
      [{ field: 'status', oldValue: grievances[grievanceIndex].status, newValue: 'escalated' }]
    );
    
    // Show toast notification
    toast({
      title: "Grievance Escalated",
      description: "Grievance has been escalated to higher management",
    });
    
    return true;
  };

  // Resolve grievance
  const resolveGrievance = (id: string, resolution: string): boolean => {
    const grievanceIndex = grievances.findIndex(g => g.id === id);
    if (grievanceIndex === -1 || !user) return false;

    const now = new Date().toISOString();
    const updatedGrievance = { ...grievances[grievanceIndex] };
    
    // Create status update
    const statusUpdate: StatusUpdate = {
      id: uuidv4(),
      timestamp: now,
      status: 'resolved',
      comment: `Resolved: ${resolution}`,
      updatedBy: user.id,
      updatedByName: user.name
    };
    
    // Update the grievance
    updatedGrievance.status = 'resolved';
    updatedGrievance.updatedAt = now;
    updatedGrievance.statusHistory = [...updatedGrievance.statusHistory, statusUpdate];
    
    // Update state
    const updatedGrievances = [...grievances];
    updatedGrievances[grievanceIndex] = updatedGrievance;
    setGrievances(updatedGrievances);
    
    // Add audit log
    addAuditLog(
      'update',
      'grievance',
      id,
      updatedGrievance.title,
      `Grievance resolved: ${resolution}`,
      [{ field: 'status', oldValue: grievances[grievanceIndex].status, newValue: 'resolved' }]
    );
    
    // Show toast notification
    toast({
      title: "Grievance Resolved",
      description: "Grievance has been marked as resolved",
    });
    
    return true;
  };

  // Get grievance by ID
  const getGrievanceById = (id: string): Grievance | undefined => {
    return grievances.find(g => g.id === id);
  };

  // Get grievances by user (created by or assigned to)
  const getGrievancesByUser = (userId: string): Grievance[] => {
    return grievances.filter(g => g.createdBy === userId || g.assignedTo === userId);
  };

  // Get grievances by department
  const getGrievancesByDepartment = (department: string): Grievance[] => {
    return grievances.filter(g => g.department === department);
  };

  // Get grievances by status
  const getGrievancesByStatus = (status: GrievanceStatus): Grievance[] => {
    return grievances.filter(g => g.status === status);
  };

  return (
    <GrievanceContext.Provider
      value={{
        grievances,
        addGrievance,
        updateGrievanceStatus,
        assignGrievance,
        addComment,
        escalateGrievance,
        resolveGrievance,
        getGrievanceById,
        getGrievancesByUser,
        getGrievancesByDepartment,
        getGrievancesByStatus
      }}
    >
      {children}
    </GrievanceContext.Provider>
  );
};

export const useGrievance = () => {
  const context = useContext(GrievanceContext);
  if (context === undefined) {
    throw new Error('useGrievance must be used within a GrievanceProvider');
  }
  return context;
}; 