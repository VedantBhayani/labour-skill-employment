
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Filter } from "lucide-react";

const Reports = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Access and download department reports and analytics
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Download size={16} />
          Export All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { 
            title: "Q3 Department Performance", 
            description: "Overall metrics and KPIs for all departments", 
            date: "September 30, 2023",
            type: "PDF"
          },
          { 
            title: "Annual Revenue Projection", 
            description: "Financial forecasting and revenue trends", 
            date: "December 15, 2023",
            type: "Excel"
          },
          { 
            title: "Employee Satisfaction Survey", 
            description: "Results from the quarterly employee feedback survey", 
            date: "August 22, 2023",
            type: "PDF"
          },
          { 
            title: "Project Completion Analysis", 
            description: "Analytics on project timelines and resource allocation", 
            date: "October 10, 2023",
            type: "PDF"
          },
          { 
            title: "Marketing Campaign Results", 
            description: "Performance metrics for Q3 marketing initiatives", 
            date: "September 15, 2023",
            type: "PowerPoint"
          },
          { 
            title: "Department Budget Overview", 
            description: "Budget allocation and expenses by department", 
            date: "July 30, 2023",
            type: "Excel"
          },
        ].map((report, index) => (
          <Card key={index} className="hover:shadow-md transition-all">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{report.title}</CardTitle>
                <FileText className="text-muted-foreground" size={18} />
              </div>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Generated: {report.date}</p>
                  <p className="text-sm font-medium">{report.type} Report</p>
                </div>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Download size={14} />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Reports;
