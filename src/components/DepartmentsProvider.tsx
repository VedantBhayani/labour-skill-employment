import React, { createContext, useState, useContext, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from "@/hooks/use-toast";

// Define types
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  email?: string;
  phone?: string;
  department: string;
  status: 'active' | 'vacation' | 'leave' | 'inactive';
}

export interface Department {
  id: string;
  name: string;
  employees: number;
  tasks: number;
  projects: number;
  managers: string[];
  progress: number;
  description: string;
  budget?: number;
  location?: string;
  teamMembers: TeamMember[];
}

// Initial departments data
const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: "hr",
    name: "HR",
    employees: 12,
    tasks: 24,
    projects: 3,
    managers: ["Sarah Johnson", "Michael Lee"],
    progress: 68,
    description: "Human Resources department handling recruiting and employee welfare",
    budget: 250000,
    location: "Floor 2, East Wing",
    teamMembers: [
      { id: "hr-1", name: "Sarah Johnson", role: "HR Director", avatar: "SJ", department: "HR", status: "active" },
      { id: "hr-2", name: "Michael Lee", role: "HR Manager", avatar: "ML", department: "HR", status: "active" },
      { id: "hr-3", name: "Emily White", role: "Recruiter", avatar: "EW", department: "HR", status: "active" },
      { id: "hr-4", name: "James Roberts", role: "HR Specialist", avatar: "JR", department: "HR", status: "vacation" }
    ]
  },
  {
    id: "sales",
    name: "Sales",
    employees: 18,
    tasks: 32,
    projects: 5,
    managers: ["David Smith", "Jennifer Williams"],
    progress: 75,
    description: "Sales department handling customer acquisition and revenue generation",
    budget: 400000,
    location: "Floor 3, North Wing",
    teamMembers: [
      { id: "sales-1", name: "David Smith", role: "Sales Director", avatar: "DS", department: "Sales", status: "active" },
      { id: "sales-2", name: "Jennifer Williams", role: "Sales Manager", avatar: "JW", department: "Sales", status: "active" },
      { id: "sales-3", name: "Thomas Brown", role: "Account Executive", avatar: "TB", department: "Sales", status: "active" },
      { id: "sales-4", name: "Amanda Miller", role: "Sales Representative", avatar: "AM", department: "Sales", status: "leave" }
    ]
  },
  {
    id: "dev",
    name: "Development",
    employees: 26,
    tasks: 48,
    projects: 7,
    managers: ["Alex Chen", "Emma Davis"],
    progress: 82,
    description: "Software development team building and maintaining our products",
    budget: 650000,
    location: "Floor 4, West Wing",
    teamMembers: [
      { id: "dev-1", name: "Alex Chen", role: "CTO", avatar: "AC", department: "Development", status: "active" },
      { id: "dev-2", name: "Emma Davis", role: "Development Lead", avatar: "ED", department: "Development", status: "active" },
      { id: "dev-3", name: "Ryan Wilson", role: "Senior Developer", avatar: "RW", department: "Development", status: "active" },
      { id: "dev-4", name: "Olivia Martin", role: "Frontend Developer", avatar: "OM", department: "Development", status: "active" }
    ]
  },
  {
    id: "marketing",
    name: "Marketing",
    employees: 14,
    tasks: 28,
    projects: 4,
    managers: ["Robert Taylor", "Sophia Wilson"],
    progress: 59,
    description: "Marketing team handling brand awareness and lead generation",
    budget: 350000,
    location: "Floor 3, South Wing",
    teamMembers: [
      { id: "marketing-1", name: "Robert Taylor", role: "Marketing Director", avatar: "RT", department: "Marketing", status: "active" },
      { id: "marketing-2", name: "Sophia Wilson", role: "Marketing Manager", avatar: "SW", department: "Marketing", status: "active" },
      { id: "marketing-3", name: "Daniel Garcia", role: "Content Strategist", avatar: "DG", department: "Marketing", status: "vacation" },
      { id: "marketing-4", name: "Isabella Lopez", role: "Social Media Specialist", avatar: "IL", department: "Marketing", status: "active" }
    ]
  },
  {
    id: "finance",
    name: "Finance",
    employees: 8,
    tasks: 15,
    projects: 2,
    managers: ["Laura Garcia", "Daniel Brown"],
    progress: 80,
    description: "Finance team handling budgeting and financial planning",
    budget: 200000,
    location: "Floor 2, South Wing",
    teamMembers: [
      { id: "finance-1", name: "Laura Garcia", role: "Finance Director", avatar: "LG", department: "Finance", status: "active" },
      { id: "finance-2", name: "Daniel Brown", role: "Financial Controller", avatar: "DB", department: "Finance", status: "active" },
      { id: "finance-3", name: "Natalie Clark", role: "Accountant", avatar: "NC", department: "Finance", status: "active" },
      { id: "finance-4", name: "Kevin Young", role: "Financial Analyst", avatar: "KY", department: "Finance", status: "inactive" }
    ]
  }
];

// Context type
interface DepartmentsContextType {
  departments: Department[];
  teamMembers: TeamMember[];
  addDepartment: (department: Omit<Department, 'id'>) => void;
  updateDepartment: (id: string, updates: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;
  addTeamMember: (teamMember: Omit<TeamMember, 'id'>) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  removeTeamMember: (id: string) => void;
  getDepartmentById: (id: string) => Department | undefined;
  getTeamMemberById: (id: string) => TeamMember | undefined;
  getTeamMembersByDepartment: (departmentId: string) => TeamMember[];
  getDepartmentPerformanceData: () => any[];
}

// Department performance data for charts
const DEPARTMENT_PERFORMANCE_DATA = [
  { name: "Jan", HR: 65, Sales: 78, Development: 82, Marketing: 58, Finance: 71 },
  { name: "Feb", HR: 59, Sales: 85, Development: 77, Marketing: 62, Finance: 68 },
  { name: "Mar", HR: 80, Sales: 88, Development: 90, Marketing: 70, Finance: 82 },
  { name: "Apr", HR: 81, Sales: 70, Development: 93, Marketing: 65, Finance: 78 },
  { name: "May", HR: 76, Sales: 67, Development: 85, Marketing: 80, Finance: 74 },
  { name: "Jun", HR: 84, Sales: 80, Development: 89, Marketing: 71, Finance: 86 },
];

// Create context
const DepartmentsContext = createContext<DepartmentsContextType | null>(null);

// Provider component
export const DepartmentsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  
  // Get all team members from all departments
  const teamMembers = departments.flatMap(dept => dept.teamMembers);

  // Add a new department
  const addDepartment = (department: Omit<Department, 'id'>) => {
    const newDepartment: Department = {
      ...department,
      id: uuidv4(),
    };

    setDepartments(prev => [...prev, newDepartment]);

    toast({
      title: "Department Added",
      description: `${newDepartment.name} department has been added successfully.`,
    });
  };

  // Update an existing department
  const updateDepartment = (id: string, updates: Partial<Department>) => {
    setDepartments(prev => 
      prev.map(dept => 
        dept.id === id 
          ? { ...dept, ...updates } 
          : dept
      )
    );

    toast({
      title: "Department Updated",
      description: "The department has been updated successfully.",
    });
  };

  // Delete a department
  const deleteDepartment = (id: string) => {
    setDepartments(prev => prev.filter(dept => dept.id !== id));

    toast({
      title: "Department Deleted",
      description: "The department has been deleted successfully.",
    });
  };

  // Add a new team member
  const addTeamMember = (teamMember: Omit<TeamMember, 'id'>) => {
    const newTeamMember: TeamMember = {
      ...teamMember,
      id: uuidv4(),
    };

    setDepartments(prev => 
      prev.map(dept => 
        dept.id === teamMember.department 
          ? { 
              ...dept, 
              employees: dept.employees + 1,
              teamMembers: [...dept.teamMembers, newTeamMember] 
            } 
          : dept
      )
    );

    toast({
      title: "Team Member Added",
      description: `${newTeamMember.name} has been added to the team.`,
    });
  };

  // Update an existing team member
  const updateTeamMember = (id: string, updates: Partial<TeamMember>) => {
    // Find the team member to get their current department
    const teamMember = teamMembers.find(tm => tm.id === id);
    if (!teamMember) return;

    // If department is changing, handle the transition
    if (updates.department && updates.department !== teamMember.department) {
      // Remove from current department
      setDepartments(prev => 
        prev.map(dept => 
          dept.id === teamMember.department 
            ? { 
                ...dept, 
                employees: dept.employees - 1,
                teamMembers: dept.teamMembers.filter(tm => tm.id !== id) 
              } 
            : dept
        )
      );

      // Add to new department
      setDepartments(prev => 
        prev.map(dept => 
          dept.id === updates.department 
            ? { 
                ...dept, 
                employees: dept.employees + 1,
                teamMembers: [...dept.teamMembers, { ...teamMember, ...updates }] 
              } 
            : dept
        )
      );
    } else {
      // Update in the same department
      setDepartments(prev => 
        prev.map(dept => 
          dept.id === teamMember.department 
            ? { 
                ...dept, 
                teamMembers: dept.teamMembers.map(tm => 
                  tm.id === id ? { ...tm, ...updates } : tm
                ) 
              } 
            : dept
        )
      );
    }

    toast({
      title: "Team Member Updated",
      description: "The team member has been updated successfully.",
    });
  };

  // Remove a team member
  const removeTeamMember = (id: string) => {
    // Find the team member to get their department
    const teamMember = teamMembers.find(tm => tm.id === id);
    if (!teamMember) return;

    setDepartments(prev => 
      prev.map(dept => 
        dept.id === teamMember.department 
          ? { 
              ...dept, 
              employees: dept.employees - 1,
              teamMembers: dept.teamMembers.filter(tm => tm.id !== id) 
            } 
          : dept
      )
    );

    toast({
      title: "Team Member Removed",
      description: `${teamMember.name} has been removed from the team.`,
    });
  };

  // Get a department by ID
  const getDepartmentById = (id: string) => {
    return departments.find(dept => dept.id === id);
  };

  // Get a team member by ID
  const getTeamMemberById = (id: string) => {
    return teamMembers.find(tm => tm.id === id);
  };

  // Get team members by department
  const getTeamMembersByDepartment = (departmentId: string) => {
    const department = departments.find(dept => dept.id === departmentId);
    return department ? department.teamMembers : [];
  };

  // Get department performance data for charts
  const getDepartmentPerformanceData = () => {
    return DEPARTMENT_PERFORMANCE_DATA;
  };

  // Context value
  const contextValue: DepartmentsContextType = {
    departments,
    teamMembers,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addTeamMember,
    updateTeamMember,
    removeTeamMember,
    getDepartmentById,
    getTeamMemberById,
    getTeamMembersByDepartment,
    getDepartmentPerformanceData,
  };

  return (
    <DepartmentsContext.Provider value={contextValue}>
      {children}
    </DepartmentsContext.Provider>
  );
};

// Custom hook for using the departments context
export const useDepartments = (): DepartmentsContextType => {
  const context = useContext(DepartmentsContext);
  if (!context) {
    throw new Error('useDepartments must be used within a DepartmentsProvider');
  }
  return context;
}; 