import { useState, useEffect } from "react";
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Calendar from "./pages/Calendar";
import Tasks from "./pages/Tasks";
import Analytics from "./pages/Analytics";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Departments from "./pages/Departments";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Discussions from "./pages/Discussions";
import Documents from "./pages/Documents";
import { Plugins } from "./pages/Plugins";
import { DashboardLayout } from "./components/layouts/DashboardLayout";
import { ThemeProvider } from "./components/ThemeProvider";
import { CommunicationProvider } from "./components/CommunicationProvider";
import { TasksProvider } from "./components/TasksProvider";
import { DepartmentsProvider } from "./components/DepartmentsProvider";
import { AuthProvider } from "./components/AuthProvider";
import { DocumentProvider } from "./components/DocumentProvider";
import { Button } from "@/components/ui/button";
import { GrievanceProvider } from "./components/GrievanceProvider";
import { AuditProvider } from "./components/AuditProvider";
import { PluginProvider } from "./components/PluginProvider";
import { PredictiveAnalyticsProvider } from "./components/PredictiveAnalyticsProvider";
import { Grievances } from "./pages/Grievances";
import { AuditLogs } from "./pages/AuditLogs";

const queryClient = new QueryClient();

// Define proper types for the error boundary
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Simple error boundary component to catch rendering errors
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Application error:", error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white text-black">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="mb-4 text-red-500">{this.state.error?.message || "Unknown error"}</p>
          <Button onClick={() => window.location.reload()}>
            Reload Application
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate a small delay for theme initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white text-black">
        <div className="animate-pulse font-bold text-xl">Loading...</div>
      </div>
    );
  }
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider defaultTheme="light">
            <AuthProvider>
              <AuditProvider>
                <GrievanceProvider>
                  <CommunicationProvider>
                    <TasksProvider>
                      <DepartmentsProvider>
                        <DocumentProvider>
                          <PluginProvider>
                            <PredictiveAnalyticsProvider>
                              <TooltipProvider>
                                <Toaster />
                                <Sonner position="top-right" />
                                <Routes>
                                  {/* Public routes */}
                                  <Route path="/login" element={<Login />} />
                                  
                                  {/* Protected dashboard routes */}
                                  <Route path="/" element={<DashboardLayout />}>
                                    <Route index element={<Index />} />
                                    <Route path="departments" element={<Departments />} />
                                    <Route path="tasks" element={<Tasks />} />
                                    <Route path="analytics" element={<Analytics />} />
                                    <Route path="advanced-analytics" element={<AdvancedAnalytics />} />
                                    <Route path="messages" element={<Messages />} />
                                    <Route path="notifications" element={<Notifications />} />
                                    <Route path="discussions" element={<Discussions />} />
                                    <Route path="calendar" element={<Calendar />} />
                                    <Route path="reports" element={<Reports />} />
                                    <Route path="documents" element={<Documents />} />
                                    <Route path="settings" element={<Settings />} />
                                    <Route path="grievances" element={<Grievances />} />
                                    <Route path="audit-logs" element={<AuditLogs />} />
                                    <Route path="plugins" element={<Plugins />} />
                                  </Route>
                                  
                                  {/* Catch all route */}
                                  <Route path="*" element={<NotFound />} />
                                </Routes>
                              </TooltipProvider>
                            </PredictiveAnalyticsProvider>
                          </PluginProvider>
                        </DocumentProvider>
                      </DepartmentsProvider>
                    </TasksProvider>
                  </CommunicationProvider>
                </GrievanceProvider>
              </AuditProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
