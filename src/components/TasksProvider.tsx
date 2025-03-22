import React, { createContext, useState, useContext, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from "@/hooks/use-toast";

// Define types
export type TaskStatus = "completed" | "in-progress" | "pending";
export type TaskPriority = "high" | "medium" | "low";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  department: string;
  priority: TaskPriority;
  assignedTo?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Initial tasks data
const INITIAL_TASKS: Task[] = [
  {
    id: "task1",
    title: "Update department overview dashboard",
    description: "Implement new data visualization for the HR department dashboard",
    status: "in-progress",
    dueDate: "Tomorrow",
    department: "Development",
    priority: "high",
    assignedTo: "user1",
    createdBy: "user2",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "task2",
    title: "Review quarterly performance metrics",
    description: "Analyze and prepare summary of Q3 performance data for all departments",
    status: "pending",
    dueDate: "Next week",
    department: "HR",
    priority: "medium",
    assignedTo: "user3",
    createdBy: "user1",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "task3",
    title: "Prepare communication hub documentation",
    description: "Create user guide for the new messaging and notification system",
    status: "completed",
    dueDate: "Yesterday",
    department: "Sales",
    priority: "low",
    assignedTo: "user2",
    createdBy: "user5",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "task4",
    title: "Task assignment system update",
    description: "Implement new features for task tracking and assignment workflow",
    status: "in-progress",
    dueDate: "3 days",
    department: "Development",
    priority: "medium",
    assignedTo: "user1",
    createdBy: "user4",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "task5",
    title: "Create marketing campaign proposal",
    description: "Develop a comprehensive marketing strategy for Q4",
    status: "pending",
    dueDate: "Next week",
    department: "Marketing",
    priority: "high",
    assignedTo: "user4",
    createdBy: "user2",
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "task6",
    title: "Update employee onboarding documentation",
    description: "Revise the onboarding materials for new hires",
    status: "completed",
    dueDate: "Last week",
    department: "HR",
    priority: "medium",
    assignedTo: "user3",
    createdBy: "user5",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "task7",
    title: "Quarterly financial report",
    description: "Prepare and review the Q3 financial statements and analysis",
    status: "in-progress",
    dueDate: "5 days",
    department: "Finance",
    priority: "high",
    assignedTo: "user5",
    createdBy: "user1",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "task8",
    title: "Implement new authentication system",
    description: "Update the user authentication flow with improved security",
    status: "pending",
    dueDate: "2 weeks",
    department: "Development",
    priority: "high",
    assignedTo: "user1",
    createdBy: "user2",
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
  },
];

// Context type
interface TasksContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  markAsCompleted: (id: string) => void;
  markAsInProgress: (id: string) => void;
  markAsPending: (id: string) => void;
  getTasksByDepartment: (department: string) => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTasksByPriority: (priority: TaskPriority) => Task[];
  getTasksByAssignee: (assignedTo: string) => Task[];
}

// Create context
const TasksContext = createContext<TasksContextType | null>(null);

// Provider component
export const TasksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  // Add a new task
  const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...task,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    setTasks(prev => [newTask, ...prev]);

    toast({
      title: "Task Added",
      description: `"${newTask.title}" has been added successfully.`,
    });
  };

  // Update an existing task
  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === id 
          ? { 
              ...task, 
              ...updates, 
              updatedAt: new Date().toISOString() 
            } 
          : task
      )
    );

    toast({
      title: "Task Updated",
      description: "The task has been updated successfully.",
    });
  };

  // Delete a task
  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));

    toast({
      title: "Task Deleted",
      description: "The task has been deleted successfully.",
    });
  };

  // Mark task as completed
  const markAsCompleted = (id: string) => {
    updateTask(id, { status: "completed" });
    
    toast({
      title: "Task Completed",
      description: "The task has been marked as completed.",
    });
  };

  // Mark task as in-progress
  const markAsInProgress = (id: string) => {
    updateTask(id, { status: "in-progress" });
    
    toast({
      title: "Task In Progress",
      description: "The task has been marked as in progress.",
    });
  };

  // Mark task as pending
  const markAsPending = (id: string) => {
    updateTask(id, { status: "pending" });
    
    toast({
      title: "Task Pending",
      description: "The task has been marked as pending.",
    });
  };

  // Get tasks by department
  const getTasksByDepartment = (department: string) => {
    return tasks.filter(task => task.department === department);
  };

  // Get tasks by status
  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  // Get tasks by priority
  const getTasksByPriority = (priority: TaskPriority) => {
    return tasks.filter(task => task.priority === priority);
  };

  // Get tasks by assignee
  const getTasksByAssignee = (assignedTo: string) => {
    return tasks.filter(task => task.assignedTo === assignedTo);
  };

  // Context value
  const contextValue: TasksContextType = {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    markAsCompleted,
    markAsInProgress,
    markAsPending,
    getTasksByDepartment,
    getTasksByStatus,
    getTasksByPriority,
    getTasksByAssignee,
  };

  return (
    <TasksContext.Provider value={contextValue}>
      {children}
    </TasksContext.Provider>
  );
};

// Custom hook for using the tasks context
export const useTasks = (): TasksContextType => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
}; 