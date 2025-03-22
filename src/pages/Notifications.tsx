import React, { useState, useEffect } from "react";
import { Bell, Check, ChevronRight, MessageSquare, AlertCircle, Calendar, FileText, Users, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCommunication, Notification } from "@/components/CommunicationProvider";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, formatDistanceToNow, parseISO, isToday, isYesterday } from "date-fns";
import { Link } from "react-router-dom";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const Notifications = () => {
  const { 
    notifications, 
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    users,
    isConnected
  } = useCommunication();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter notifications based on active tab and search query
  const filteredNotifications = notifications.filter((notification) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "unread" && !notification.isRead) ||
      (activeTab === notification.type);

    const matchesSearch =
      !searchQuery ||
      notification.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getSenderName(notification.senderId).toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  // Count unread notifications
  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  // Count notifications by type
  const messageCounts = notifications.filter(n => n.type === "message").length;
  const taskCounts = notifications.filter(n => n.type === "task").length;
  const meetingCounts = notifications.filter(n => n.type === "meeting").length;
  const documentCounts = notifications.filter(n => n.type === "document").length;
  const mentionCounts = notifications.filter(n => n.type === "mention").length;

  // Handle marking a notification as read
  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
  };

  // Handle marking all notifications as read
  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead();
  };

  // Handle deleting a notification
  const handleDeleteNotification = (id: string) => {
    deleteNotification(id);
  };

  // Format notification timestamp
  const formatNotificationTime = (timestamp: string) => {
    try {
      const date = parseISO(timestamp);
      const now = new Date();
      
      if (isToday(date)) {
        return formatDistanceToNow(date, { addSuffix: true });
      } else if (isYesterday(date)) {
        return "Yesterday at " + format(date, "h:mm a");
      } else {
        return format(date, "MMM d 'at' h:mm a");
      }
    } catch (e) {
      return timestamp;
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case "task":
        return <FileText className="h-5 w-5 text-green-500" />;
      case "meeting":
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case "document":
        return <FileText className="h-5 w-5 text-yellow-500" />;
      case "mention":
        return <Users className="h-5 w-5 text-pink-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get notification link based on type
  const getNotificationLink = (notification: Notification) => {
    switch (notification.type) {
      case "message":
        return `/messages?channel=${notification.channelId}`;
      case "task":
        return `/tasks?task=${notification.taskId}`;
      case "meeting":
        return `/calendar?event=${notification.meetingId}`;
      case "document":
        return `/documents?document=${notification.documentId}`;
      case "mention":
        return `/messages?channel=${notification.channelId}&highlight=${notification.messageId}`;
      default:
        return "#";
    }
  };

  // Get sender name
  const getSenderName = (senderId: string) => {
    const sender = users.find(user => user.id === senderId);
    return sender ? sender.name : "Unknown User";
  };

  // Get sender avatar
  const getSenderAvatar = (senderId: string) => {
    const sender = users.find(user => user.id === senderId);
    return sender ? sender.avatar : "??";
  };

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups: Record<string, Notification[]>, notification) => {
    try {
      const date = parseISO(notification.timestamp);
      let groupKey;
      
      if (isToday(date)) {
        groupKey = "Today";
      } else if (isYesterday(date)) {
        groupKey = "Yesterday";
      } else {
        groupKey = format(date, "MMMM d, yyyy");
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      
      groups[groupKey].push(notification);
    } catch (e) {
      // Fallback for invalid dates
      if (!groups["Other"]) {
        groups["Other"] = [];
      }
      groups["Other"].push(notification);
    }
    
    return groups;
  }, {});

  return (
    <div className="animate-fade-in">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Notifications</CardTitle>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                  <Check className="mr-2 h-4 w-4" />
                  Mark all as read
                </Button>
              )}
              <Badge variant="secondary" className="ml-2">
                {unreadCount} unread
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isConnected && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Connection lost</AlertTitle>
              <AlertDescription>
                You've been disconnected from the notification service.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 w-full sm:w-auto grid grid-cols-3 sm:flex sm:space-x-2">
              <TabsTrigger value="all">
                All
                <Badge variant="secondary" className="ml-2">
                  {notifications.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                <Badge variant="secondary" className="ml-2">
                  {unreadCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="message">
                Messages
                <Badge variant="secondary" className="ml-2">
                  {messageCounts}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="task">
                Tasks
                <Badge variant="secondary" className="ml-2">
                  {taskCounts}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="meeting">
                Meetings
                <Badge variant="secondary" className="ml-2">
                  {meetingCounts}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="document">
                Documents
                <Badge variant="secondary" className="ml-2">
                  {documentCounts}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="mention">
                Mentions
                <Badge variant="secondary" className="ml-2">
                  {mentionCounts}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              <ScrollArea className="h-[calc(100vh-15rem)]">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No notifications</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {activeTab === "all"
                        ? "You don't have any notifications yet"
                        : activeTab === "unread"
                        ? "You don't have any unread notifications"
                        : `You don't have any ${activeTab} notifications`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.keys(groupedNotifications).map((date) => (
                      <div key={date}>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">{date}</h3>
                        <div className="space-y-2">
                          {groupedNotifications[date].map((notification: Notification) => (
                            <div 
                              key={notification.id}
                              className={`flex items-start p-3 rounded-lg border ${
                                !notification.isRead ? "bg-muted/30" : ""
                              }`}
                            >
                              <div className="flex-shrink-0 mr-4 mt-1">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1">
                                  <div className="flex items-center">
                                    <Avatar className="h-6 w-6 mr-2">
                                      <AvatarFallback>{getSenderAvatar(notification.senderId)}</AvatarFallback>
                                    </Avatar>
                                    <p className="text-sm font-medium">
                                      {getSenderName(notification.senderId)}
                                    </p>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {formatNotificationTime(notification.timestamp)}
                                  </p>
                                </div>
                                <Link 
                                  to={getNotificationLink(notification)} 
                                  className="text-sm text-foreground hover:underline leading-5"
                                  onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                                >
                                  {notification.content}
                                </Link>
                                {notification.additionalInfo && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {notification.additionalInfo}
                                  </p>
                                )}
                                <div className="flex items-center mt-2">
                                  {!notification.isRead && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 px-2 text-xs"
                                      onClick={() => handleMarkAsRead(notification.id)}
                                    >
                                      <Check className="mr-1 h-3 w-3" />
                                      Mark as read
                                    </Button>
                                  )}
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteNotification(notification.id)}
                                  >
                                    <X className="mr-1 h-3 w-3" />
                                    Delete
                                  </Button>
                                  <Button 
                                    asChild
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 px-2 text-xs ml-auto"
                                  >
                                    <Link to={getNotificationLink(notification)}>
                                      View
                                      <ChevronRight className="ml-1 h-3 w-3" />
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
