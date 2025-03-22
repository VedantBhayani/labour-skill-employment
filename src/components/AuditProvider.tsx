import React, { createContext, useState, useContext, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { useAuth } from './AuthProvider';

// Define types
export type AuditActionType = 
  | 'login' 
  | 'logout' 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'view'
  | 'download'
  | 'upload'
  | 'approve'
  | 'reject'
  | 'assign'
  | 'escalate';

export type AuditEntityType = 
  | 'user'
  | 'document'
  | 'task'
  | 'department'
  | 'message'
  | 'notification'
  | 'report'
  | 'grievance'
  | 'system';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  actionType: AuditActionType;
  entityType: AuditEntityType;
  entityId?: string;
  entityName?: string;
  details?: string;
  ipAddress?: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  department?: string;
}

export interface AuditTrail {
  entityId: string;
  entityType: AuditEntityType;
  history: AuditLog[];
}

interface AuditContextType {
  logs: AuditLog[];
  addAuditLog: (
    actionType: AuditActionType,
    entityType: AuditEntityType,
    entityId?: string,
    entityName?: string,
    details?: string,
    changes?: { field: string; oldValue: any; newValue: any }[]
  ) => void;
  getLogsByEntity: (entityType: AuditEntityType, entityId?: string) => AuditLog[];
  getEntityHistory: (entityType: AuditEntityType, entityId: string) => AuditTrail | null;
  getRecentUserActivity: (userId: string, limit?: number) => AuditLog[];
  getSystemAuditLogs: (limit?: number) => AuditLog[];
  clearLogs: () => void;
}

// Sample initial audit logs for demonstration
const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    userId: 'user1',
    userName: 'Admin User',
    actionType: 'create',
    entityType: 'department',
    entityId: 'hr',
    entityName: 'HR Department',
    details: 'Created new department',
    ipAddress: '192.168.1.1',
    department: 'Management'
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    userId: 'user2',
    userName: 'Department Head',
    actionType: 'update',
    entityType: 'task',
    entityId: 'task1',
    entityName: 'Quarterly Review',
    details: 'Updated task status',
    changes: [
      { field: 'status', oldValue: 'pending', newValue: 'in-progress' }
    ],
    ipAddress: '192.168.1.2',
    department: 'Engineering'
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    userId: 'user3',
    userName: 'Manager User',
    actionType: 'approve',
    entityType: 'document',
    entityId: 'doc1',
    entityName: 'Q2 Financial Report',
    details: 'Approved document for publication',
    ipAddress: '192.168.1.3',
    department: 'Marketing'
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    userId: 'user4',
    userName: 'Employee User',
    actionType: 'view',
    entityType: 'document',
    entityId: 'doc2',
    entityName: 'HR Policy Manual',
    details: 'Viewed document',
    ipAddress: '192.168.1.4',
    department: 'Finance'
  },
  {
    id: '5',
    timestamp: new Date().toISOString(),
    userId: 'user1',
    userName: 'Admin User',
    actionType: 'login',
    entityType: 'user',
    entityId: 'user1',
    entityName: 'Admin User',
    details: 'User logged in',
    ipAddress: '192.168.1.1',
    department: 'Management'
  }
];

const AuditContext = createContext<AuditContextType | undefined>(undefined);

export const AuditProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const { user } = useAuth();

  // Add new audit log
  const addAuditLog = (
    actionType: AuditActionType,
    entityType: AuditEntityType,
    entityId?: string,
    entityName?: string,
    details?: string,
    changes?: { field: string; oldValue: any; newValue: any }[]
  ) => {
    const newLog: AuditLog = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      userId: user?.id || 'unknown',
      userName: user?.name || 'Unknown User',
      actionType,
      entityType,
      entityId,
      entityName,
      details,
      ipAddress: '127.0.0.1', // In a real app, you would get the actual IP
      changes,
      department: user?.department
    };

    setLogs(prevLogs => [newLog, ...prevLogs]);
    return newLog;
  };

  // Get logs filtered by entity type and optionally by entity ID
  const getLogsByEntity = (entityType: AuditEntityType, entityId?: string): AuditLog[] => {
    return logs.filter(log => 
      log.entityType === entityType && 
      (entityId ? log.entityId === entityId : true)
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  // Get the complete history for a specific entity
  const getEntityHistory = (entityType: AuditEntityType, entityId: string): AuditTrail | null => {
    const entityLogs = getLogsByEntity(entityType, entityId);
    
    if (entityLogs.length === 0) {
      return null;
    }

    return {
      entityId,
      entityType,
      history: entityLogs
    };
  };

  // Get recent activity for a specific user
  const getRecentUserActivity = (userId: string, limit = 10): AuditLog[] => {
    return logs
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  };

  // Get system-wide audit logs with optional limit
  const getSystemAuditLogs = (limit?: number): AuditLog[] => {
    const sortedLogs = [...logs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return limit ? sortedLogs.slice(0, limit) : sortedLogs;
  };

  // Clear all logs (admin function)
  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <AuditContext.Provider
      value={{
        logs,
        addAuditLog,
        getLogsByEntity,
        getEntityHistory,
        getRecentUserActivity,
        getSystemAuditLogs,
        clearLogs
      }}
    >
      {children}
    </AuditContext.Provider>
  );
};

export const useAudit = () => {
  const context = useContext(AuditContext);
  if (context === undefined) {
    throw new Error('useAudit must be used within an AuditProvider');
  }
  return context;
}; 