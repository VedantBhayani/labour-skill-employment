import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  LayoutDashboard, 
  Users, 
  FileText, 
  MessageSquare, 
  Calendar, 
  Settings, 
  BellRing, 
  CheckSquare,
  MessagesSquare,
  MessageCircle,
  Bell,
  FileBadge,
  ChevronLeftSquare,
  ChevronRightSquare,
  ClipboardList,
  Package,
  BrainCircuit
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

interface DashboardSidebarProps {
  collapsed: boolean;
}

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  collapsed: boolean;
  active?: boolean;
}

const SidebarItem = ({ icon: Icon, label, to, collapsed, active }: SidebarItemProps) => {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200",
        "hover:bg-sidebar-accent group",
        active ? "bg-sidebar-accent text-primary" : "text-sidebar-foreground"
      )}
    >
      <Icon size={20} className={active ? "text-primary" : "text-sidebar-foreground"} />
      {!collapsed && (
        <span className="text-sm font-medium transition-opacity duration-200">{label}</span>
      )}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          {label}
        </div>
      )}
    </Link>
  );
};

const SidebarSection = ({ title, collapsed, children }: { title: string; collapsed: boolean; children: React.ReactNode }) => {
  return (
    <div className="mb-6">
      {!collapsed && (
        <h3 className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider px-3 mb-2">
          {title}
        </h3>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
};

export function DashboardSidebar({ collapsed }: DashboardSidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <aside
      className={cn(
        "fixed top-14 left-0 bottom-0 z-10 bg-sidebar h-[calc(100vh-3.5rem)] border-r border-border",
        "transition-all duration-300 ease-in-out bg-sidebar",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="h-full flex flex-col overflow-y-auto py-4 px-3">
        <SidebarSection title="Main" collapsed={collapsed}>
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            to="/" 
            collapsed={collapsed} 
            active={location.pathname === "/"} 
          />
          <SidebarItem 
            icon={Users} 
            label="Department Overview" 
            to="/departments" 
            collapsed={collapsed} 
            active={location.pathname === "/departments"} 
          />
          <SidebarItem 
            icon={CheckSquare} 
            label="Task Management" 
            to="/tasks" 
            collapsed={collapsed} 
            active={location.pathname === "/tasks"} 
          />
          <SidebarItem 
            icon={BarChart3} 
            label="Analytics" 
            to="/analytics" 
            collapsed={collapsed} 
            active={location.pathname === "/analytics"} 
          />
          <SidebarItem 
            icon={BrainCircuit} 
            label="Advanced Analytics" 
            to="/advanced-analytics" 
            collapsed={collapsed} 
            active={location.pathname === "/advanced-analytics"} 
          />
        </SidebarSection>

        <SidebarSection title="Communication" collapsed={collapsed}>
          <SidebarItem 
            icon={MessageCircle} 
            label="Messages" 
            to="/messages" 
            collapsed={collapsed} 
            active={location.pathname === "/messages"} 
          />
          <SidebarItem 
            icon={MessagesSquare} 
            label="Discussions" 
            to="/discussions" 
            collapsed={collapsed} 
            active={location.pathname === "/discussions"} 
          />
          <SidebarItem 
            icon={Bell} 
            label="Notifications" 
            to="/notifications" 
            collapsed={collapsed} 
            active={location.pathname === "/notifications"} 
          />
          <SidebarItem 
            icon={FileText} 
            label="Grievances" 
            to="/grievances" 
            collapsed={collapsed} 
            active={location.pathname === "/grievances"} 
          />
        </SidebarSection>

        <SidebarSection title="Productivity" collapsed={collapsed}>
          <SidebarItem 
            icon={Calendar} 
            label="Calendar" 
            to="/calendar" 
            collapsed={collapsed} 
            active={location.pathname === "/calendar"} 
          />
          <SidebarItem 
            icon={FileText} 
            label="Reports" 
            to="/reports" 
            collapsed={collapsed} 
            active={location.pathname === "/reports"} 
          />
          <SidebarItem 
            icon={FileBadge} 
            label="Documents" 
            to="/documents" 
            collapsed={collapsed} 
            active={location.pathname === "/documents"} 
          />
        </SidebarSection>

        {isAdmin && (
          <SidebarSection title="Administration" collapsed={collapsed}>
            <SidebarItem 
              icon={ClipboardList} 
              label="Audit Logs" 
              to="/audit-logs" 
              collapsed={collapsed} 
              active={location.pathname === "/audit-logs"} 
            />
            <SidebarItem 
              icon={Package} 
              label="Plugins" 
              to="/plugins" 
              collapsed={collapsed} 
              active={location.pathname === "/plugins"} 
            />
          </SidebarSection>
        )}

        <div className="mt-auto">
          <SidebarItem 
            icon={Settings} 
            label="Settings" 
            to="/settings" 
            collapsed={collapsed} 
            active={location.pathname === "/settings"} 
          />
        </div>
      </div>
    </aside>
  );
}
