import React, { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Search, 
  Send, 
  Users, 
  Plus,
  Paperclip,
  Smile,
  MoreHorizontal,
  Pin,
  Star,
  Archive,
  Info,
  Edit,
  Trash2,
  AlertTriangle,
  WifiOff,
  RefreshCw
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCommunication } from "@/components/CommunicationProvider";
import type { User } from "@/components/CommunicationProvider";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Messages = () => {
  // Get communication context
  const { 
    currentUser, 
    users, 
    channels, 
    messages, 
    sendMessage, 
    markMessageAsRead,
    deleteMessage,
    editMessage,
    createChannel,
    isConnected,
    reconnect,
    switchUser,
    clearChannelMessages
  } = useCommunication();

  // Employee user for role switching
  const employeeUser = {
    id: 'employee1',
    name: 'Employee User',
    avatar: 'EU',
    status: 'online' as const,
    role: 'Employee',
    department: 'Engineering'
  };

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [activeChannel, setActiveChannel] = useState("");
  const [channelType, setChannelType] = useState("channels"); // 'channels' or 'direct'
  const [messageToEdit, setMessageToEdit] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showNewChannelDialog, setShowNewChannelDialog] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDescription, setNewChannelDescription] = useState("");
  const [newChannelType, setNewChannelType] = useState<"department" | "team">("team");
  const [isPrivate, setIsPrivate] = useState(false);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [emojiMenuOpen, setEmojiMenuOpen] = useState(false);

  // Filter channels and direct messages
  const departmentChannels = channels.filter(channel => 
    channel.type === "department" || channel.type === "team"
  );
  
  const directChannels = channels.filter(channel => 
    channel.type === "direct" && 
    channel.members.includes(currentUser.id)
  );

  // Set default active channel if none is selected
  useEffect(() => {
    // If no active channel is set, try to use the testing channel
    if (!activeChannel) {
      const testingChannel = channels.find(channel => channel.id === 'testing');
      if (testingChannel) {
        setActiveChannel(testingChannel.id);
        setChannelType("channels");
      } else if (departmentChannels.length > 0) {
        setActiveChannel(departmentChannels[0].id);
      }
    }
  }, [activeChannel, departmentChannels, channels]);

  // Filtered channels based on search
  const filteredChannels = departmentChannels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDirectMessages = directChannels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get active channel messages
  const activeChannelMessages = activeChannel ? messages[activeChannel] || [] : [];

  // Mark messages as read when viewing channel
  useEffect(() => {
    if (activeChannel) {
      activeChannelMessages.forEach(message => {
        if (!message.isRead && message.senderId !== currentUser.id) {
          markMessageAsRead(message.id, activeChannel);
        }
      });
    }
  }, [activeChannel, activeChannelMessages, currentUser.id, markMessageAsRead]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (messageContent.trim() && activeChannel) {
      await sendMessage(activeChannel, messageContent);
      setMessageContent("");
    }
  };

  // Handle message editing
  const handleStartEdit = (messageId: string) => {
    const message = activeChannelMessages.find(msg => msg.id === messageId);
    if (message) {
      setMessageToEdit(messageId);
      setEditContent(message.content);
    }
  };

  const handleSaveEdit = async () => {
    if (messageToEdit && editContent.trim()) {
      await editMessage(messageToEdit, activeChannel, editContent);
      setMessageToEdit(null);
      setEditContent("");
    }
  };

  const handleCancelEdit = () => {
    setMessageToEdit(null);
    setEditContent("");
  };

  // Handle message deletion
  const handleDeleteMessage = async (messageId: string) => {
    if (confirm("Are you sure you want to delete this message?")) {
      await deleteMessage(messageId, activeChannel);
    }
  };

  // Handle create new channel
  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    
    await createChannel({
      name: newChannelName,
      type: newChannelType,
      members: [currentUser.id],
      description: newChannelDescription,
      isPrivate: isPrivate
    });
    
    setShowNewChannelDialog(false);
    setNewChannelName("");
    setNewChannelDescription("");
    setNewChannelType("team");
    setIsPrivate(false);
  };

  // Get active channel info
  const getChannelInfo = () => {
    const channel = channels.find(c => c.id === activeChannel);
    if (!channel) return null;
    
    const memberCount = channel.members.length;
    const otherMembers = channel.members.filter(id => id !== currentUser.id);
    const memberNames = otherMembers.map(id => {
      const user = users.find(u => u.id === id);
      return user ? user.name : "Unknown";
    });
    
    if (channel.type === "direct") {
      return {
        name: channel.name,
        type: "Direct Message",
        status: otherMembers.length === 1 
          ? users.find(u => u.id === otherMembers[0])?.status || "offline"
          : null
      };
    }
    
    return {
      name: channel.name,
      type: channel.type === "department" ? "Department" : "Team",
      description: channel.description,
      memberCount: memberCount
    };
  };

  // Format message timestamp
  const formatMessageTime = (timestamp: string) => {
    try {
      const date = parseISO(timestamp);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      if (messageDate.getTime() === today.getTime()) {
        return format(date, "h:mm a");
      } else if (messageDate.getTime() > today.getTime() - 7 * 24 * 60 * 60 * 1000) {
        return format(date, "EEE 'at' h:mm a");
      } else {
        return format(date, "MMM d 'at' h:mm a");
      }
    } catch (e) {
      return timestamp;
    }
  };

  // Get user info for a message - add type guard for User
  const getMessageUser = (userId: string) => {
    // Ensure we always return the current user object for current user ID
    // This fixes the role display issue
    if (userId === currentUser.id) {
      return currentUser;
    }
    
    // For all other users, look them up in the users array
    const user = users.find(user => user.id === userId);
    if (user) return user;
    
    // Fallback for unknown user
    return { 
      id: userId, // Add ID for consistency
      name: "Unknown User", 
      avatar: "??",
      role: "Unknown", 
      status: "offline" as const,
      department: "Unknown"
    };
  };

  // Count unread messages per channel
  const getUnreadCount = (channelId: string) => {
    const channelMessages = messages[channelId] || [];
    return channelMessages.filter(
      msg => !msg.isRead && msg.senderId !== currentUser.id
    ).length;
  };

  // Handle key down for message sending
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle file attachment
  const handleAttachment = () => {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt';
    fileInput.multiple = false;
    
    // Handle file selection
    fileInput.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const file = files[0];
        // In a real app, you would upload the file to server
        // For demo purposes, we'll just append a text message with file info
        const fileMessage = `[File: ${file.name} (${(file.size / 1024).toFixed(2)} KB)]`;
        setMessageContent(prev => prev ? `${prev} ${fileMessage}` : fileMessage);
      }
    };
    
    // Trigger file selection dialog
    fileInput.click();
  };
  
  // Handle emoji selection
  const handleEmoji = (emoji: string) => {
    setMessageContent(prev => prev + emoji);
    setEmojiMenuOpen(false);
  };

  // Common emojis for quick access
  const commonEmojis = ['😊', '👍', '🎉', '👋', '🙏', '❤️', '😂', '🔥', '✅', '⭐'];

  const channelInfo = getChannelInfo();

  // Add isFullUser type guard function
  const isFullUser = (user: any): user is User => {
    return user && typeof user === 'object' && 'role' in user;
  };

  // Handle user switching with proper UI updates
  const handleUserSwitch = (userId: string) => {
    // Switch the user
    const success = switchUser(userId);
    
    if (success && activeChannel === 'testing') {
      // Clear all messages to avoid confusion with roles
      clearChannelMessages(activeChannel);
      
      // Force a re-render
      setTimeout(() => {
        // Add a welcome message as the current user
        sendMessage(activeChannel, `I am now logged in as ${currentUser.role}`);
      }, 500);
    }
  };

  // Debug useEffect to log current user
  useEffect(() => {
    console.log("Current user changed:", currentUser);
  }, [currentUser]);

  return (
    <div className="h-[calc(100vh-5rem)] animate-fade-in flex">
      <Card className="w-72 h-full border-r rounded-none mr-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Messages</CardTitle>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{currentUser.avatar}</AvatarFallback>
                    </Avatar>
                    <span>{currentUser.role}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    className="flex items-center gap-2"
                    onClick={() => handleUserSwitch('admin')}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>AU</AvatarFallback>
                    </Avatar>
                    <span>Admin User</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="flex items-center gap-2"
                    onClick={() => handleUserSwitch('user1')}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <span>Department Head</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="flex items-center gap-2"
                    onClick={() => handleUserSwitch('employee1')}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>EU</AvatarFallback>
                    </Avatar>
                    <span>Employee</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Dialog open={showNewChannelDialog} onOpenChange={setShowNewChannelDialog}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" title="Create new channel">
                    <Plus size={18} />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Channel</DialogTitle>
                    <DialogDescription>
                      Create a new channel for team collaboration
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label htmlFor="channel-name" className="text-sm font-medium">Channel Name</label>
                      <Input
                        id="channel-name"
                        placeholder="Enter channel name"
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="channel-description" className="text-sm font-medium">Description</label>
                      <Textarea
                        id="channel-description"
                        placeholder="What is this channel about?"
                        value={newChannelDescription}
                        onChange={(e) => setNewChannelDescription(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Channel Type</label>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            checked={newChannelType === "team"}
                            onChange={() => setNewChannelType("team")}
                            className="h-4 w-4"
                          />
                          <span>Team</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            checked={newChannelType === "department"}
                            onChange={() => setNewChannelType("department")}
                            className="h-4 w-4"
                          />
                          <span>Department</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="private-channel"
                        checked={isPrivate}
                        onChange={() => setIsPrivate(!isPrivate)}
                        className="h-4 w-4"
                      />
                      <label htmlFor="private-channel" className="text-sm font-medium">Make private</label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewChannelDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreateChannel}>Create Channel</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <Tabs defaultValue="channels" onValueChange={setChannelType}>
          <TabsList className="grid grid-cols-2 mx-4">
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="direct">Direct</TabsTrigger>
          </TabsList>
          <TabsContent value="channels" className="m-0">
            <ScrollArea className="h-[calc(100vh-14rem)]">
              <div className="px-2 py-2">
                {filteredChannels.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No channels found
                  </div>
                ) : (
                  filteredChannels.map((channel) => {
                    const unreadCount = getUnreadCount(channel.id);
                    return (
                      <button
                        key={channel.id}
                        className={`w-full flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors mb-1 text-left ${
                          activeChannel === channel.id && channelType === "channels" ? "bg-primary/10" : ""
                        }`}
                        onClick={() => {
                          setActiveChannel(channel.id);
                          setChannelType("channels");
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquare size={18} className={channel.isPrivate ? "text-amber-500" : ""} />
                          <span className="truncate max-w-[160px]">{channel.name}</span>
                        </div>
                        {unreadCount > 0 && (
                          <Badge variant="secondary" className="bg-primary text-primary-foreground">
                            {unreadCount}
                          </Badge>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="direct" className="m-0">
            <ScrollArea className="h-[calc(100vh-14rem)]">
              <div className="px-2 py-2">
                {filteredDirectMessages.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No direct messages found
                  </div>
                ) : (
                  filteredDirectMessages.map((channel) => {
                    // Find other user in direct message
                    const otherUserId = channel.members.find(id => id !== currentUser.id);
                    const user = otherUserId ? users.find(u => u.id === otherUserId) : null;
                    const unreadCount = getUnreadCount(channel.id);
                    
                    return (
                      <button
                        key={channel.id}
                        className={`w-full flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors mb-1 text-left ${
                          activeChannel === channel.id && channelType === "direct" ? "bg-primary/10" : ""
                        }`}
                        onClick={() => {
                          setActiveChannel(channel.id);
                          setChannelType("direct");
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>{user?.avatar || "??"}</AvatarFallback>
                            </Avatar>
                            {user && (
                              <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${
                                user.status === "online" ? "bg-green-500" : 
                                user.status === "away" ? "bg-yellow-500" : "bg-gray-400"
                              }`}></div>
                            )}
                          </div>
                          <div>
                            <span className="truncate max-w-[120px] text-sm">{user?.name || channel.name}</span>
                          </div>
                        </div>
                        {unreadCount > 0 && (
                          <Badge variant="secondary" className="bg-primary text-primary-foreground">
                            {unreadCount}
                          </Badge>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </Card>

      <div className="flex-1 flex flex-col h-full">
        {!isConnected && (
          <Alert variant="destructive" className="mb-2">
            <WifiOff className="h-4 w-4" />
            <AlertTitle>Connection lost</AlertTitle>
            <AlertDescription>
              You've been disconnected from the messaging service.
              <Button variant="outline" size="sm" className="ml-2" onClick={reconnect}>
                Reconnect
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {!activeChannel && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No conversation selected</h3>
              <p className="text-sm text-muted-foreground">
                Choose a channel or direct message to start chatting
              </p>
            </div>
          </div>
        )}
        
        {activeChannel && channelInfo && (
          <>
            <div className="border-b p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {channelType === "direct" ? (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {channelInfo.type === "Direct Message" && channelInfo.name.split(',')[0].trim().charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <MessageSquare size={20} />
                )}
                <div>
                  <h2 className="font-medium">{channelInfo.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {channelInfo.type} • 
                    {channelInfo.type === "Direct Message" 
                      ? channelInfo.status === "online" 
                        ? " Online" 
                        : channelInfo.status === "away" 
                          ? " Away" 
                          : " Offline"
                      : ` ${channelInfo.memberCount} members`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => window.location.reload()}>
                  <RefreshCw size={18} />
                </Button>
                {activeChannel === 'testing' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => clearChannelMessages(activeChannel)}
                    className="mr-2"
                  >
                    Clear Messages
                  </Button>
                )}
                <Button variant="ghost" size="icon">
                  <Users size={18} />
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Info size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{channelInfo.description || "No description available"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal size={18} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Pin size={16} /> Pin Conversation
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Star size={16} /> Mark as Favorite
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Archive size={16} /> Archive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              {activeChannelMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No messages yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Be the first to send a message in this {channelInfo.type.toLowerCase()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeChannelMessages.map((msg) => {
                    // Determine if the message is from the current user
                    const isMine = msg.senderId === currentUser.id;
                    
                    // Get the sender user object
                    const sender = getMessageUser(msg.senderId);
                    const isEditing = messageToEdit === msg.id;
                    
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex gap-3 group ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        {!isMine && (
                          <div className="flex flex-col items-center">
                            <Avatar className="h-8 w-8 mt-1">
                              <AvatarFallback>{sender.avatar}</AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                        <div className={`max-w-[70%] ${isMine ? "items-end" : "items-start"}`}>
                          <div className={`flex items-center gap-2 mb-1 ${isMine ? "justify-end" : ""}`}>
                            <p className="text-xs text-muted-foreground">{formatMessageTime(msg.timestamp)}</p>
                            {msg.isEdited && (
                              <p className="text-xs text-muted-foreground">(edited)</p>
                            )}
                            {isMine && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={() => handleStartEdit(msg.id)}
                                >
                                  <Edit size={14} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => handleDeleteMessage(msg.id)}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          {isEditing ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="min-h-[60px]"
                              />
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                                  Cancel
                                </Button>
                                <Button size="sm" onClick={handleSaveEdit}>
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className={`p-3 rounded-lg ${
                                isMine 
                                  ? "bg-primary text-primary-foreground rounded-tr-none" 
                                  : "bg-muted rounded-tl-none"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          )}
                        </div>
                        {isMine && !isEditing && (
                          <div className="flex flex-col items-center">
                            <Avatar className="h-8 w-8 mt-1">
                              <AvatarFallback>{currentUser.avatar}</AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex items-end gap-2">
                <Textarea 
                  placeholder={isConnected ? "Type your message..." : "Reconnecting..."}
                  className="min-h-24 resize-none"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!isConnected}
                />
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleAttachment}
                    disabled={!isConnected}
                  >
                    <Paperclip size={18} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setEmojiMenuOpen(!emojiMenuOpen)}
                    disabled={!isConnected}
                  >
                    <Smile size={18} />
                  </Button>
                  {emojiMenuOpen && (
                    <div className="absolute bottom-12 right-0 bg-background border rounded-md shadow-md p-2 w-64">
                      <div className="grid grid-cols-5 gap-2">
                        {commonEmojis.map((emoji, index) => (
                          <Button 
                            key={index} 
                            variant="ghost" 
                            className="h-8 w-8 p-0" 
                            onClick={() => handleEmoji(emoji)}
                          >
                            {emoji}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button 
                    size="icon" 
                    className="rounded-full" 
                    onClick={handleSendMessage}
                    disabled={!messageContent.trim() || !isConnected}
                  >
                    <Send size={18} />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Messages;
