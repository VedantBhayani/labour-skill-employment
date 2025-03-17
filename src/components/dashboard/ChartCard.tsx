
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  ResponsiveContainer, 
  CartesianGrid, 
  Bar, 
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  Pie, 
  Legend 
} from "recharts";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  data: any[];
  type: "bar" | "line" | "pie";
  dataKey: string;
  className?: string;
  categories?: string[];
  colors?: string[];
}

export function ChartCard({
  title,
  data,
  type,
  dataKey,
  className,
  categories = ["category"],
  colors = ["#8B5CF6", "#6366F1", "#3B82F6", "#10B981", "#F59E0B"],
}: ChartCardProps) {
  return (
    <Card className={cn("animate-fade-in", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {type === "bar" ? (
              <BarChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }} 
                  tickLine={false}
                  axisLine={{ stroke: "#ddd", strokeWidth: 1 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  tickLine={false} 
                  axisLine={{ stroke: "#ddd", strokeWidth: 1 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: "6px", 
                    border: "none", 
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" 
                  }} 
                />
                {categories.map((category, index) => (
                  <Bar 
                    key={`bar-${category}`} 
                    dataKey={category} 
                    fill={colors[index % colors.length]} 
                    radius={[4, 4, 0, 0]}
                    animationDuration={1000}
                  />
                ))}
              </BarChart>
            ) : type === "line" ? (
              <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }} 
                  tickLine={false}
                  axisLine={{ stroke: "#ddd", strokeWidth: 1 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  tickLine={false} 
                  axisLine={{ stroke: "#ddd", strokeWidth: 1 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: "6px", 
                    border: "none", 
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" 
                  }} 
                />
                {categories.map((category, index) => (
                  <Line
                    key={`line-${category}`}
                    type="monotone"
                    dataKey={category}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    animationDuration={1000}
                  />
                ))}
              </LineChart>
            ) : (
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey={dataKey}
                  animationDuration={1000}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "6px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
