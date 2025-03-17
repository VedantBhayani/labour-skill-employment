import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Bell,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  Users,
  Calendar,
  Settings,
  Filter,
  MoreHorizontal,
  CheckSquare,
  Trash2,
  BellOff,
  Mail,
  Smartphone,
  Monitor
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const notificationsData = [
  {
    id: "not1",
    type: "task" as const,
    content: "New task assigned: Quarterly report review",
    timestamp: "10 minutes ago",
    user: { name: "John Smith", avatar: "JS" },
    read: false,
  },
  {
    id: "not2",
    type: "message" as const,
    content: "Sarah Johnson mentioned you in HR channel",
    timestamp: "25 minutes ago",
    user: { name: "Sarah Johnson", avatar: "SJ" },
    read: false,
  },
  {
    id: "not3",
    type: "document" as const,
    content: "Mike Chen updated project documentation",
    timestamp: "1 hour ago",
    user: { name: "Mike Chen", avatar: "MC" },
    read: false,
  },
  {
    id: "not4",
    type: "team" as const,
    content: "Ana Rodriguez created new team: Data Analytics",
    timestamp: "2 hours ago",
    user: { name: "Ana Rodriguez", avatar: "AR" },
    read: true,
  },
  {
    id: "not5",
    type: "user" as const,
    content: "Raj Patel joined as: Technical Writer",
    timestamp: "3 hours ago",
    user: { name: "Raj Patel", avatar: "RP" },
    read: true,
  },
  {
    id: "not6",
    type: "task" as const,
    content: "Leila Wong completed task: System maintenance",
    timestamp: "5 hours ago",
    user: { name: "Leila Wong", avatar: "LW" },
    read: true,
  },
  {
    id: "not7",
    type: "calendar" as const,
    content: "Upcoming meeting: Quarterly Review at 3:00 PM",
    timestamp: "6 hours ago",
    user: { name: "Calendar System", avatar: "CS" },
    read: true,
  },
  {
    id: "not8",
    type: "message" as const,
    content: "New announcement in General channel",
    timestamp: "8 hours ago",
    user: { name: "David Lee", avatar: "DL" },
    read: true,
  },
  {
    id: "not9",
    type: "document" as const,
    content: "Emma Davis shared a document: Q3 Strategy",
    timestamp: "Yesterday",
    user: { name: "Emma Davis", avatar: "ED" },
    read: true,
  },
  {
    id: "not10",
    type: "team" as const,
    content: "You were added to Project X team",
    timestamp: "Yesterday",
    user: { name: "Alex Wong", avatar: "AW" },
    read: true,
  },
];

const notificationPreferences = [
  {
    id: "tasks",
    name: "Task Assignments",
    description: "When you are assigned a new task",
    email: true,
    push: true,
    desktop: true,
  },
  {
    id: "mentions",
    name: "Mentions",
    description: "When someone mentions you in comments or messages",
    email: true,
    push: true,
    desktop: true,
  },
  {
    id: "comments",
    name: "Comments and Replies",
    description: "When someone comments on your work or replies to you",
    email: false,
    push: true,
    desktop: true,
  },
  {
    id: "deadlines",
    name: "Deadlines",
    description: "Reminders about upcoming and overdue tasks",
    email: true,
    push: true,
    desktop: false,
  },
  {
    id: "updates",
    name: "Document Updates",
    description: "When documents you follow are updated",
    email: false,
    push: false,
    desktop: true,
  },
  {
    id: "team",
    name: "Team Changes",
    description: "When members join or leave your teams",
    email: true,
    push: false,
    desktop: false,
  },
  {
    id: "calendar",
    name: "Calendar Events",
    description: "Upcoming meetings and event reminders",
    email: true,
    push: true,
    desktop: true,
  },
];

const NotificationItem = ({ notification, onMarkAsRead, onDelete }: any) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "task":
        return <CheckSquare className="h-5 w-5 text-blue-500" />;
      case "message":
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case "document":
        return <FileText className="h-5 w-5 text-yellow-500" />;
      case "calendar":
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case "team":
        return <Users className="h-5 w-5 text-indigo-500" />;
      case "user":
        return <Users className="h-5 w-5 text-pink-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className={`p-4 border-b hover:bg-muted/50 transition-colors ${!notification.read ? "bg-primary/5" : ""}`}>
      <div className="flex">
        <div className="mr-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{notification.user.avatar}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                {getTypeIcon(notification.type)}
                <p className="font-medium">{notification.content}</p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">From {notification.user.name}</p>
                <p className="text-xs text-muted-foreground">• {notification.timestamp}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => onDelete(notification.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Notifications = () => {
  const [notifications, setNotifications] = useState(notificationsData);
  const [preferences, setPreferences] = useState(notificationPreferences);
  const [showAll, setShowAll] = useState(true);

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = showAll 
    ? notifications 
    : notifications.filter(n => !n.read);

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(not => 
      not.id === id ? { ...not, read: true } : not
    ));
  };

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter(not => not.id !== id));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(not => ({ ...not, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const togglePreference = (id: string, type: 'email' | 'push' | 'desktop') => {
    setPreferences(preferences.map(pref => 
      pref.id === id ? { ...pref, [type]: !pref[type] } : pref
    ));
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Manage your notifications and preferences
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  {unreadCount > 0 
                    ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                    : "All caught up!"
                  }
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1" 
                  onClick={() => setShowAll(!showAll)}
                >
                  <Filter size={16} />
                  {showAll ? "Show Unread" : "Show All"}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleMarkAllAsRead} className="gap-2">
                      <CheckCircle2 size={16} /> Mark all as read
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleClearAll} className="gap-2 text-destructive">
                      <Trash2 size={16} /> Clear all notifications
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="all">
              <TabsList className="w-full px-6 pt-1.5 justify-start">
                <TabsTrigger value="all" className="gap-2">
                  All
                  <Badge variant="secondary" className="ml-1">
                    {notifications.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="m-0">
                {notifications.length > 0 ? (
                  <ScrollArea className="h-[calc(100vh-16rem)]">
                    {filteredNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onDelete={handleDelete}
                      />
                    ))}
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BellOff size={48} className="text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No notifications</h3>
                    <p className="text-muted-foreground mt-1">
                      You're all caught up! No notifications to display.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="settings" className="m-0 p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Notification Preferences</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Configure how and when you receive notifications
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label htmlFor="notifications-enabled">Enable All Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Master switch for all notification types
                      </p>
                    </div>
                    <Switch id="notifications-enabled" defaultChecked />
                  </div>

                  <Separator />

                  <div className="grid gap-4">
                    <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                      <div className="col-span-6">Notification Type</div>
                      <div className="col-span-2 text-center flex items-center justify-center gap-1">
                        <Mail size={14} /> Email
                      </div>
                      <div className="col-span-2 text-center flex items-center justify-center gap-1">
                        <Smartphone size={14} /> Push
                      </div>
                      <div className="col-span-2 text-center flex items-center justify-center gap-1">
                        <Monitor size={14} /> Desktop
                      </div>
                    </div>

                    {preferences.map((pref) => (
                      <div key={pref.id} className="grid grid-cols-12 gap-4 items-center border-b pb-4">
                        <div className="col-span-6">
                          <Label>{pref.name}</Label>
                          <p className="text-sm text-muted-foreground">
                            {pref.description}
                          </p>
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <Checkbox 
                            checked={pref.email} 
                            onCheckedChange={() => togglePreference(pref.id, 'email')}
                          />
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <Checkbox 
                            checked={pref.push} 
                            onCheckedChange={() => togglePreference(pref.id, 'push')}
                          />
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <Checkbox 
                            checked={pref.desktop} 
                            onCheckedChange={() => togglePreference(pref.id, 'desktop')}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-medium">Notification Schedule</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Configure quiet hours when you won't receive notifications
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="time-from" className="text-xs">From</Label>
                          <Input id="time-from" type="time" defaultValue="22:00" className="h-8" />
                        </div>
                        <div>
                          <Label htmlFor="time-to" className="text-xs">To</Label>
                          <Input id="time-to" type="time" defaultValue="08:00" className="h-8" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button>Save Preferences</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
