
import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Mail, MessageSquare, FileText, Users, Monitor, Check, Calendar, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Example notifications data
const notifications = [
  {
    id: 1,
    type: "message",
    content: "Sarah Johnson mentioned you in a comment",
    time: "5 minutes ago",
    read: false,
    sender: {
      name: "Sarah Johnson",
      avatar: "SJ"
    }
  },
  {
    id: 2,
    type: "task",
    content: "New task assigned: Quarterly report review",
    time: "30 minutes ago",
    read: false,
    sender: {
      name: "David Smith",
      avatar: "DS"
    }
  },
  {
    id: 3,
    type: "system",
    content: "System maintenance scheduled for tonight at 2 AM",
    time: "2 hours ago",
    read: true,
    sender: {
      name: "System",
      avatar: "SY"
    }
  },
  {
    id: 4,
    type: "calendar",
    content: "Meeting reminder: Team standup at 10:00 AM tomorrow",
    time: "5 hours ago",
    read: true,
    sender: {
      name: "Calendar",
      avatar: "CA"
    }
  },
  {
    id: 5,
    type: "message",
    content: "Emma Davis sent you a direct message",
    time: "Yesterday",
    read: true,
    sender: {
      name: "Emma Davis",
      avatar: "ED"
    }
  },
  {
    id: 6,
    type: "document",
    content: "Alex Chen shared a document: 'Q3 Marketing Plan'",
    time: "Yesterday",
    read: true,
    sender: {
      name: "Alex Chen",
      avatar: "AC"
    }
  },
  {
    id: 7,
    type: "task",
    content: "Task deadline approaching: Project presentation",
    time: "2 days ago",
    read: true,
    sender: {
      name: "Project Manager",
      avatar: "PM"
    }
  },
];

const Notifications = () => {
  const [activeTab, setActiveTab] = useState("all");
  
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.read;
    return notification.type === activeTab;
  });
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "task":
        return <Check className="h-4 w-4 text-green-500" />;
      case "system":
        return <Monitor className="h-4 w-4 text-purple-500" />;
      case "calendar":
        return <Calendar className="h-4 w-4 text-amber-500" />;
      case "document":
        return <FileText className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with activities across your organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Mark All as Read</Button>
          <Button variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Preferences
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <CardTitle>Activity Feed</CardTitle>
              <CardDescription>
                You have {unreadCount} unread notifications
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 px-6">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>All</span>
              <Badge variant="secondary" className="ml-auto">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>Unread</span>
              <Badge variant="secondary" className="ml-auto">
                {unreadCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="message" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Messages</span>
            </TabsTrigger>
            <TabsTrigger value="task" className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span>System</span>
            </TabsTrigger>
          </TabsList>
          
          <CardContent className="pt-6">
            <TabsContent value={activeTab} className="m-0 space-y-0">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground text-center">No notifications to display</p>
                </div>
              ) : (
                <div>
                  {filteredNotifications.map((notification, i) => (
                    <React.Fragment key={notification.id}>
                      {i > 0 && <Separator />}
                      <div className={`py-4 ${!notification.read ? 'bg-primary/5' : ''}`}>
                        <div className="flex gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{notification.sender.avatar}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="font-medium">{notification.sender.name}</span>
                                <span className="ml-2 flex items-center">
                                  {getTypeIcon(notification.type)}
                                </span>
                                {!notification.read && (
                                  <Badge variant="secondary" className="ml-2 bg-primary text-primary-foreground">
                                    New
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {notification.time}
                              </span>
                            </div>
                            <p className="text-sm">{notification.content}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                              {!notification.read && (
                                <Button variant="ghost" size="sm">
                                  Mark as Read
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Notifications;
