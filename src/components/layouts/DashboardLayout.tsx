
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <DashboardHeader sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
      
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar collapsed={sidebarCollapsed} />
        
        <main className={cn(
          "flex-1 overflow-y-auto transition-all duration-300 ease-in-out p-6",
          sidebarCollapsed ? "ml-16" : "ml-64",
        )}>
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
