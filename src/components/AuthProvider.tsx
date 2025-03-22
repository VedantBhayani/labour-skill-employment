import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from "@/hooks/use-toast";

// Define types
export type UserRole = 'admin' | 'department_head' | 'manager' | 'team_lead' | 'employee' | 'guest';

export interface Permission {
  action: string;
  subject: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  department: string;
  permissions: Permission[];
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (user: Partial<AuthUser>, password: string) => Promise<boolean>;
  hasPermission: (action: string, subject: string) => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password'];

// Default permissions based on role
const defaultPermissions: Record<UserRole, Permission[]> = {
  admin: [
    { action: 'manage', subject: 'all' },
  ],
  department_head: [
    { action: 'read', subject: 'all' },
    { action: 'manage', subject: 'department' },
    { action: 'manage', subject: 'document' },
    { action: 'manage', subject: 'task' },
  ],
  manager: [
    { action: 'read', subject: 'all' },
    { action: 'create', subject: 'document' },
    { action: 'update', subject: 'document' },
    { action: 'manage', subject: 'task' },
  ],
  team_lead: [
    { action: 'read', subject: 'department' },
    { action: 'read', subject: 'document' },
    { action: 'create', subject: 'document' },
    { action: 'update', subject: 'task' },
    { action: 'create', subject: 'task' },
  ],
  employee: [
    { action: 'read', subject: 'department' },
    { action: 'read', subject: 'document' },
    { action: 'update', subject: 'task' },
  ],
  guest: [
    { action: 'read', subject: 'public' },
  ],
};

// Mock users for development
const MOCK_USERS = [
  {
    id: 'user1',
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    avatar: 'AU',
    role: 'admin' as UserRole,
    department: 'Management',
    permissions: defaultPermissions.admin,
  },
  {
    id: 'user2',
    name: 'Department Head',
    email: 'head@example.com',
    password: 'password123',
    avatar: 'DH',
    role: 'department_head' as UserRole,
    department: 'Engineering',
    permissions: defaultPermissions.department_head,
  },
  {
    id: 'user3',
    name: 'Manager User',
    email: 'manager@example.com',
    password: 'password123',
    avatar: 'MU',
    role: 'manager' as UserRole,
    department: 'Marketing',
    permissions: defaultPermissions.manager,
  },
  {
    id: 'user4',
    name: 'Employee User',
    email: 'employee@example.com',
    password: 'password123',
    avatar: 'EU',
    role: 'employee' as UserRole,
    department: 'Finance',
    permissions: defaultPermissions.employee,
  },
];

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if current route is public
  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);

  // Check for existing session on mount
  useEffect(() => {
    const restoreSession = () => {
      setLoading(true);
      try {
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          console.log("Session restored for:", parsedUser.name);
        }
      } catch (e) {
        console.error('Failed to parse stored user data:', e);
        localStorage.removeItem('auth_user');
      } finally {
        setLoading(false);
      }
    };
    
    restoreSession();
  }, []);

  // Handle routing based on authentication status
  useEffect(() => {
    if (loading) return; // Don't redirect while loading
    
    if (user) {
      // User is authenticated
      if (isPublicRoute) {
        // If on a public route (like login) and already authenticated, redirect to dashboard
        console.log("Already authenticated, redirecting to dashboard");
        navigate('/', { replace: true });
      }
    } else {
      // User is not authenticated
      if (!isPublicRoute) {
        // If on a protected route and not authenticated, redirect to login
        console.log("Not authenticated, redirecting to login");
        navigate('/login', { replace: true });
      }
    }
  }, [user, loading, location.pathname, navigate, isPublicRoute]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const foundUser = MOCK_USERS.find(u => u.email === email && u.password === password);
      
      if (foundUser) {
        const { password, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword as AuthUser);
        localStorage.setItem('auth_user', JSON.stringify(userWithoutPassword));
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${foundUser.name}`,
        });
        
        // Explicit navigation to avoid any issues
        navigate('/', { replace: true });
        return true;
      }
      
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
      
      return false;
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    navigate('/login', { replace: true });
  };

  const register = async (userData: Partial<AuthUser>, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Check if user with email already exists
      if (MOCK_USERS.some(u => u.email === userData.email)) {
        toast({
          title: "Registration failed",
          description: "User with this email already exists",
          variant: "destructive",
        });
        
        return false;
      }
      
      // Create new user
      const newUser: AuthUser = {
        id: `user${MOCK_USERS.length + 1}`,
        name: userData.name || 'New User',
        email: userData.email || '',
        avatar: userData.avatar || userData.name?.substring(0, 2).toUpperCase() || 'NU',
        role: userData.role || 'employee',
        department: userData.department || 'General',
        permissions: defaultPermissions[userData.role || 'employee'],
      };
      
      // In a real app, this would call an API to create the user
      MOCK_USERS.push({ ...newUser, password });
      
      // Auto-login the new user
      setUser(newUser);
      localStorage.setItem('auth_user', JSON.stringify(newUser));
      
      toast({
        title: "Registration successful",
        description: "Your account has been created",
      });
      
      // Navigate to dashboard
      navigate('/', { replace: true });
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (action: string, subject: string): boolean => {
    if (!user) return false;
    
    return user.permissions.some(
      permission =>
        // Check for exact permission match
        (permission.action === action && permission.subject === subject) ||
        // Check for wildcard action
        (permission.action === 'manage' && permission.subject === subject) ||
        // Check for wildcard subject
        (permission.action === action && permission.subject === 'all') ||
        // Check for full wildcard
        (permission.action === 'manage' && permission.subject === 'all')
    );
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    hasPermission,
    loading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const withPermission = (
  Component: React.ComponentType<any>,
  requiredAction: string,
  requiredSubject: string
) => {
  return (props: any) => {
    const { hasPermission, user, loading } = useAuth();
    
    if (loading) {
      return <div>Loading...</div>;
    }
    
    if (!user) {
      return <div>Please log in to access this resource.</div>;
    }
    
    if (!hasPermission(requiredAction, requiredSubject)) {
      return <div>You don't have permission to access this resource.</div>;
    }
    
    return <Component {...props} />;
  };
}; 