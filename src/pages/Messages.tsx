import React, { useState, useEffect, useRef } from "react";
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
  RefreshCw,
  SendHorizontal
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
import type { User, Message, Channel, Notification } from "@/components/CommunicationProvider";
import { ConnectionStatus } from "@/lib/websocketService";
import { realTimeService, MOCK_MODE } from "@/lib/realTimeService";
import { websocketService } from "@/lib/websocketService";
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
import { useAuth } from "@/components/AuthProvider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

// Mock WebSocket functionality for development
const ENABLE_MOCK_WEBSOCKET = true; // Set to false in production

// Add mock functions
const createMockMessage = (channelId, content, currentUser) => {
  return {
    id: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    channelId,
    senderId: currentUser.id,
    content,
    timestamp: new Date().toISOString(),
    isRead: false,
    isEdited: false
  };
};

// Debug component for channel storage
const StorageDebugger = () => {
  const { getLocalStorageInfo, resetLocalStorage } = useCommunication();
  const [isOpen, setIsOpen] = useState(false);
  
  const handleCheckStorage = () => {
    const info = getLocalStorageInfo();
    console.log('LocalStorage Info:', info);
    toast({
      title: "Storage Check",
      description: `Found ${info.channels.length} channels in localStorage`,
    });
  };
  
  if (!isOpen) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className="absolute right-4 bottom-4 opacity-30 hover:opacity-100" 
        onClick={() => setIsOpen(true)}
      >
        <span className="text-xs">Debug</span>
      </Button>
    );
  }
  
  return (
    <div className="fixed right-4 bottom-20 bg-slate-900 border border-slate-800 p-4 rounded-md shadow-xl z-50 w-80">
      <div className="flex justify-between mb-2">
        <h3 className="text-sm font-medium">Storage Debugger</h3>
        <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setIsOpen(false)}>×</Button>
      </div>
      <div className="space-y-2">
        <Button size="sm" variant="outline" className="w-full text-xs" onClick={handleCheckStorage}>
          Check localStorage
        </Button>
        <Button size="sm" variant="outline" className="w-full text-xs" onClick={resetLocalStorage}>
          Reset to Default Channels
        </Button>
        <div className="text-xs text-slate-400 mt-2">
          <p>If new channels aren't persisting between reloads:</p>
          <ul className="list-disc pl-4 mt-1 space-y-1">
            <li>Check if localStorage is enabled in your browser</li>
            <li>Check console for any storage errors</li>
            <li>Try resetting to defaults if data is corrupted</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Debug component for WebSocket connection
const WebSocketDiagnostic = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<{
    url: string;
    connected: boolean;
    lastError: string | null;
    attempts: number;
  }>({
    url: 'Unknown',
    connected: false,
    lastError: null,
    attempts: 0
  });

  // Update connection info
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      setStatus({
        url: websocketService['url'] || 'Unknown',
        connected: websocketService.getStatus() === 'connected',
        lastError: WebSocketErrors.lastError,
        attempts: websocketService['reconnectAttempts'] || 0
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isOpen]);
  
  // Force a reconnection
  const forceReconnect = async () => {
    try {
      await websocketService.connect();
    } catch (error) {
      console.error('Manual reconnect failed:', error);
    }
  };
  
  if (!isOpen) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className="absolute right-4 top-4 opacity-30 hover:opacity-100 z-50" 
        onClick={() => setIsOpen(true)}
      >
        <span className="text-xs">WebSocket</span>
      </Button>
    );
  }
  
  return (
    <div className="fixed right-4 top-14 bg-slate-900 border border-slate-800 p-4 rounded-md shadow-xl z-50 w-96">
      <div className="flex justify-between mb-2">
        <h3 className="text-sm font-medium">WebSocket Diagnostic</h3>
        <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setIsOpen(false)}>×</Button>
      </div>
      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-1">
          <span className="text-slate-400">URL:</span>
          <span>{status.url}</span>
          
          <span className="text-slate-400">Status:</span>
          <span className={status.connected ? "text-green-500" : "text-red-500"}>
            {status.connected ? "Connected" : "Disconnected"}
          </span>
          
          <span className="text-slate-400">Attempts:</span>
          <span>{status.attempts}</span>
          
          {status.lastError && (
            <>
              <span className="text-slate-400">Last Error:</span>
              <span className="text-red-400">{status.lastError}</span>
            </>
          )}
        </div>
        
        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="default" className="w-full text-xs" onClick={forceReconnect}>
            Force Reconnect
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            className="w-full text-xs"
            onClick={() => {
              WebSocketErrors.clear();
              setStatus(prev => ({ ...prev, lastError: null }));
            }}
          >
            Clear Errors
          </Button>
        </div>
      </div>
    </div>
  );
};

// Global error tracking for WebSocket
const WebSocketErrors = {
  lastError: null as string | null,
  setError(error: string) {
    this.lastError = error;
    console.error('WebSocket Error:', error);
  },
  clear() {
    this.lastError = null;
  }
};

// Override WebSocket to track errors
(() => {
  try {
    const originalWebSocket = window.WebSocket;
    // @ts-ignore - extending the WebSocket class
    window.WebSocket = function(url: string, protocols?: string | string[]) {
      console.log(`Creating WebSocket connection to: ${url}`);
      const socket = new originalWebSocket(url, protocols);
      
      const originalOnError = socket.onerror;
      socket.onerror = function(event: Event) {
        WebSocketErrors.setError(`Connection error to ${url}`);
        if (originalOnError) originalOnError.call(this, event);
      };
      
      return socket;
    };
    // @ts-ignore - copying prototype
    window.WebSocket.prototype = originalWebSocket.prototype;
    
    // Copy constants without direct assignment
    Object.defineProperties(window.WebSocket, {
      CONNECTING: { value: originalWebSocket.CONNECTING },
      OPEN: { value: originalWebSocket.OPEN },
      CLOSING: { value: originalWebSocket.CLOSING },
      CLOSED: { value: originalWebSocket.CLOSED }
    });
  } catch (error) {
    console.error('Failed to override WebSocket:', error);
  }
})();

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
    switchUser,
    clearChannelMessages,
    typingUsers,
    startTyping,
    stopTyping,
    connectionStatus,
    markChannelAsRead
  } = useCommunication();

  // Initialize real-time service on component mount
  useEffect(() => {
    // Initialize WebSocket connection if not already connected
    if (connectionStatus !== 'connected' && connectionStatus !== 'connecting') {
      realTimeService.initialize({
        userId: currentUser.id,
        authToken: 'dummy-token', // Replace with actual auth token in production
        enablePushNotifications: false,
        onConnectionStatusChange: (status) => {
          console.log('WebSocket connection status:', status);
          if (status === 'connected') {
            toast({
              title: MOCK_MODE ? "Connected (Mock Mode)" : "Connected",
              description: MOCK_MODE ? 
                "Successfully connected to mock messaging service" : 
                "Successfully connected to messaging service",
            });
          }
        },
        onMessageReceived: (message) => {
          console.log('New message received:', message);
          // In a real implementation, the CommunicationProvider would handle this
          // But we could add logic here to handle mock messages
        }
      }).catch(err => {
        console.error('Failed to initialize real-time service:', err);
      });
    }
    
    // Cleanup on component unmount
    return () => {
      // No need to disconnect on unmount as other components might use the service
    };
  }, [currentUser.id, connectionStatus]);

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
    channel.name.includes(searchQuery.toLowerCase())
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

  // Enhance handleSendMessage to work with mock when disconnected
  const handleSendMessage = async (content: string) => {
    if (content.trim() && activeChannel) {
      try {
        // Add a unique ID to track messages and prevent duplicates
        const messageId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        console.log(`Sending message with ID: ${messageId}`);
        
        // If using mock and disconnected, we'll simulate message sending
        if (ENABLE_MOCK_WEBSOCKET && !isConnected) {
          // Create a mock message with our generated ID
          const mockMessage = {
            id: messageId,
            channelId: activeChannel,
            senderId: currentUser.id,
            content,
            timestamp: new Date().toISOString(),
            isRead: false,
            isEdited: false
          };
          
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Reset message input
          setMessageContent("");
          
          // Show toast to indicate mock mode
          toast({
            title: "Mock Mode Active",
            description: "Message sent in offline simulation mode",
          });
          
          return;
        }
        
        // Normal flow - send via communication service
        // Pass the messageId to help with deduplication
        await sendMessage(activeChannel, content, messageId);
        setMessageContent("");
      } catch (error) {
        console.error("Error sending message:", error);
        
        // Fall back to mock if real sending fails
        if (ENABLE_MOCK_WEBSOCKET) {
          const mockMessage = createMockMessage(activeChannel, content, currentUser);
          // Add to the local message store (would need to modify CommunicationProvider to support this)
          toast({
            title: "Fallback Mode",
            description: "Message saved locally (connection issue)",
          });
          setMessageContent("");
        } else {
          toast({
            title: "Error",
            description: "Failed to send message due to connection issues",
            variant: "destructive"
          });
        }
      }
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
    
    await createChannel(
      newChannelName,
      newChannelType,
      [currentUser.id],
      newChannelDescription,
      isPrivate
    );
    
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
    // Ensure we get the most up-to-date user from the users array
    // This is critical for correct avatar display
    console.log(`Looking up user with ID: ${userId}`);
    const user = users.find(user => user.id === userId);
    
    if (user) {
      console.log(`Found user: ${user.name}, Role: ${user.role}, Avatar: ${user.avatar}`);
      return user;
    }
    
    // Special handling for built-in users
    if (userId === 'admin') {
      return {
        id: 'admin',
        name: 'Admin User',
        avatar: 'AU',
        role: 'admin',
        status: 'online' as const,
        department: 'Administration'
      };
    }
    
    if (userId === 'user1') {
      return {
        id: 'user1',
        name: 'John Doe',
        avatar: 'DH',
        role: 'Department Head',
        status: 'online' as const,
        department: 'Engineering'
      };
    }
    
    if (userId === 'employee1') {
      return {
        id: 'employee1',
        name: 'Employee User',
        avatar: 'EU',
        role: 'Employee',
        status: 'online' as const,
        department: 'Engineering'
      };
    }
    
    // Fallback for unknown user
    console.log(`User not found for ID: ${userId}, using fallback`);
    return { 
      id: userId,
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
      handleSendMessage(messageContent);
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
    console.log(`Switching to user: ${userId}`);
    
    // First, find the user to get correct avatar
    const userToSwitchTo = users.find(u => u.id === userId);
    console.log("User to switch to:", userToSwitchTo);
    
    // Perform the switch
    const success = switchUser(userId);
    
    if (success) {
      // Get the user from the users array
      const user = users.find(u => u.id === userId);
      
      if (user) {
        console.log(`Successfully switched to: ${user.name} (${user.role}), Avatar: ${user.avatar}`);
        
        // Don't force refresh the component state to avoid UI flicker
        // Don't clear messages - this was causing the issue where messages disappeared
        
        // Just update the UI state to trigger a re-render
        setMessageContent("");
      }
    }
  };

  // Debug useEffect to log current user
  useEffect(() => {
    console.log("Current user changed:", currentUser);
  }, [currentUser]);

  // Get the actual authenticated user
  const { user: authUser } = useAuth();

  // Update the useEffect to sync with auth system
  useEffect(() => {
    // This will run on component mount and sync messaging user with auth user
    if (authUser) {
      // Map auth user role to messaging user ID
      let messagingUserId = 'admin'; // default
      
      switch(authUser.role) {
        case 'admin':
          messagingUserId = 'admin';
          break;
        case 'department_head':
          messagingUserId = 'user1'; // Department Head
          break;
        case 'employee':
        case 'manager':
        case 'team_lead':
          messagingUserId = 'employee1'; // Employee/standard user
          break;
      }
      
      // Only switch if needed
      if (currentUser.id !== messagingUserId) {
        console.log(`Auto-syncing messaging user to match auth role: ${authUser.role}`);
        handleUserSwitch(messagingUserId);
      }
    }
  }, [authUser, currentUser.id]);

  // Add typing indicator components
  const TypingIndicator = ({ users, channelId }: { users: User[], channelId: string }) => {
    const typingUserIds = typingUsers[channelId] || [];
    
    if (typingUserIds.length === 0) {
      return null;
    }
    
    const typingUserNames = typingUserIds.map(id => {
      const user = users.find(u => u.id === id);
      return user ? user.name : 'Someone';
    });
    
    let typingText = '';
    if (typingUserNames.length === 1) {
      typingText = `${typingUserNames[0]} is typing...`;
    } else if (typingUserNames.length === 2) {
      typingText = `${typingUserNames[0]} and ${typingUserNames[1]} are typing...`;
    } else if (typingUserNames.length > 2) {
      typingText = `${typingUserNames[0]} and ${typingUserNames.length - 1} others are typing...`;
    }
    
    return (
      <div className="flex items-center text-xs text-muted-foreground animate-pulse p-2">
        <div className="flex space-x-1">
          <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce"></div>
          <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce delay-75"></div>
          <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce delay-150"></div>
        </div>
        <span className="ml-2">{typingText}</span>
      </div>
    );
  };

  // Update the ConnectionStatus component
  const ConnectionStatusIndicator = () => {
    // Auto-reconnect after delay
    useEffect(() => {
      let reconnectTimeout: number | null = null;
      
      if (connectionStatus === 'disconnected') {
        // Attempt to reconnect after 5 seconds
        reconnectTimeout = window.setTimeout(() => {
          console.log('Auto-reconnecting after disconnect...');
          reconnect();
        }, 5000);
      }
      
      return () => {
        if (reconnectTimeout !== null) {
          window.clearTimeout(reconnectTimeout);
        }
      };
    }, [connectionStatus]);
    
    if (connectionStatus === 'connected') {
      return (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center opacity-70 hover:opacity-100 transition-opacity z-50">
          <div className="w-2 h-2 rounded-full bg-white mr-1"></div>
          Connected
        </div>
      );
    }
    
    let statusText = '';
    let statusClass = '';
    let icon = null;
    
    switch (connectionStatus) {
      case 'connecting':
        statusText = 'Connecting...';
        statusClass = 'bg-yellow-500';
        icon = <RefreshCw className="h-3 w-3 mr-1 animate-spin" />;
        break;
      case 'reconnecting':
        statusText = 'Reconnecting...';
        statusClass = 'bg-yellow-500';
        icon = <RefreshCw className="h-3 w-3 mr-1 animate-spin" />;
        break;
      case 'disconnected':
        statusText = 'Disconnected';
        statusClass = 'bg-red-500';
        icon = <WifiOff className="h-3 w-3 mr-1" />;
        break;
    }
    
    return (
      <div className={`fixed bottom-4 right-4 ${statusClass} text-white text-xs px-2 py-1 rounded-full flex items-center z-50`}>
        {icon}
        {statusText}
        {connectionStatus === 'disconnected' && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-1 h-4 w-4 text-white hover:bg-white/20" 
            onClick={reconnect}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  };

  // Update the ChatInput component to handle typing indicators
  const ChatInput = ({ onSendMessage, channelId }: { onSendMessage: (content: string) => void, channelId: string }) => {
    const [message, setMessage] = useState("");
    const { startTyping, stopTyping } = useCommunication();
    const typingTimeoutRef = useRef<number | null>(null);
    
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value);
      
      // Send typing indicator when user starts typing
      startTyping(channelId);
      
      // Clear previous timeout if exists
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = window.setTimeout(() => {
        stopTyping(channelId);
        typingTimeoutRef.current = null;
      }, 2000);
    };
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (message.trim()) {
        onSendMessage(message);
        setMessage("");
        
        // Stop typing indicator when message is sent
        stopTyping(channelId);
        
        // Clear timeout if exists
        if (typingTimeoutRef.current) {
          window.clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      }
    };
    
    // Cleanup timeouts on unmount
    useEffect(() => {
      return () => {
        if (typingTimeoutRef.current) {
          window.clearTimeout(typingTimeoutRef.current);
        }
        // Ensure typing indicator is stopped when component unmounts
        stopTyping(channelId);
      };
    }, [channelId, stopTyping]);
    
    return (
      <form onSubmit={handleSubmit} className="border-t p-4 flex items-end gap-2">
        <Textarea
          value={message}
          onChange={handleChange}
          placeholder="Type a message..."
          className="min-h-[80px] flex-1"
        />
        <Button type="submit" size="icon" disabled={!message.trim()}>
          <SendHorizontal className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    );
  };

  // Add NotificationSettings component
  const NotificationSettings = () => {
    const { pushNotificationsEnabled, enablePushNotifications, disablePushNotifications } = useCommunication();
    const [loading, setLoading] = useState(false);
    
    const handleToggle = async () => {
      setLoading(true);
      
      try {
        if (pushNotificationsEnabled) {
          await disablePushNotifications();
        } else {
          await enablePushNotifications();
        }
      } catch (error) {
        console.error('Error toggling notifications:', error);
        toast({
          title: "Error",
          description: "Failed to update notification settings.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    return (
      <div className="flex items-center space-x-2">
        <Switch
          checked={pushNotificationsEnabled}
          onCheckedChange={handleToggle}
          disabled={loading}
          id="push-notifications"
        />
        <Label htmlFor="push-notifications">
          {pushNotificationsEnabled ? 'Push notifications enabled' : 'Enable push notifications'}
        </Label>
      </div>
    );
  };

  // Function to reconnect to websocket
  const reconnect = async () => {
    // Show reconnecting toast
    toast({
      title: "Reconnecting...",
      description: "Attempting to reconnect to the messaging service",
    });
    
    try {
      // First try reinitialization if service is not initialized
      await realTimeService.initialize({
        userId: currentUser.id,
        authToken: 'dummy-token', // Replace with actual auth token in production
        enablePushNotifications: false,
        onConnectionStatusChange: (status) => {
          console.log('WebSocket connection status changed to:', status);
        }
      });
      
      // Then attempt a standard reconnect
      const success = await realTimeService.reconnect();
      
      if (success) {
        toast({
          title: "Connected",
          description: "Successfully reconnected to messaging service",
        });
        return true;
      } else {
        toast({
          title: "Connection Failed",
          description: "Could not reconnect to messaging service. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Reconnect failed:', error);
      toast({
        title: "Connection Error",
        description: "Failed to reconnect. Please check your network connection.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Find the channel click handler functions and update them to mark channel as read
  const handleChannelClick = (channel: Channel) => {
    // Set active channel
    setActiveChannel(channel.id);
    
    // Mark all messages in this channel as read when clicking
    markChannelAsRead(channel.id);
  };

  // Also modify the direct message handlers
  const handleDirectMessageClick = (channel: Channel) => {
    // Set active channel
    setActiveChannel(channel.id);
    
    // Mark all messages in this channel as read when clicking
    markChannelAsRead(channel.id);
  };

  return (
    <div className="h-[calc(100vh-5rem)] animate-fade-in flex relative">
      {/* Add connection status indicator */}
      <ConnectionStatusIndicator />
      
      {/* Add WebSocket diagnostic */}
      <WebSocketDiagnostic />
      
      {/* Add storage debugger */}
      <StorageDebugger />
      
      <Card className="w-72 h-full border-r rounded-none mr-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Messages</CardTitle>
            <div className="flex items-center gap-2">
              <Dialog open={showNewChannelDialog} onOpenChange={setShowNewChannelDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4 mr-1" />
                    New
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
                {!Array.isArray(filteredChannels) || filteredChannels.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No channels found
                    <div className="mt-2">
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="px-0 text-xs"
                        onClick={() => {
                          const { resetLocalStorage } = useCommunication();
                          resetLocalStorage();
                          toast({
                            title: "Channels Reset",
                            description: "Default channels have been restored."
                          });
                        }}
                      >
                        Restore default channels
                      </Button>
                    </div>
                  </div>
                ) : (
                  filteredChannels.map((channel) => {
                    // Skip rendering invalid channels
                    if (!channel || !channel.id || !channel.name) {
                      console.warn('Found invalid channel in list:', channel);
                      return null;
                    }
                    
                    const unreadCount = getUnreadCount(channel.id);
                    return (
                      <button
                        key={channel.id}
                        className={`w-full flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors mb-1 text-left ${
                          activeChannel === channel.id && channelType === "channels" ? "bg-primary/10" : ""
                        }`}
                        onClick={() => {
                          handleChannelClick(channel);
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
                          handleDirectMessageClick(channel);
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
            <AlertDescription className="flex items-center">
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
                    // Always get a fresh reference to the user from the users array
                    const sender = getMessageUser(msg.senderId);
                    
                    // Determine if the message is from the current user based on sender ID
                    // This controls message positioning (left/right)
                    const isMine = msg.senderId === currentUser.id;
                    
                    // Debug logging to troubleshoot avatar issues
                    console.log(`Rendering message: "${msg.content}", From: ${sender.name}, ID: ${msg.senderId}, Avatar: ${sender.avatar}, IsMine: ${isMine}`);
                    
                    const isEditing = messageToEdit === msg.id;
                    
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex gap-3 group ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        {!isMine && (
                          <div className="flex-shrink-0 w-8">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{sender.avatar}</AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                        <div className={`flex flex-col max-w-[70%] ${isMine ? "items-end" : "items-start"}`}>
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
                            <div className="space-y-2 w-full">
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
                          <div className="flex-shrink-0 w-8">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{sender.avatar}</AvatarFallback>
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
                    onClick={() => handleSendMessage(messageContent)}
                    disabled={!messageContent.trim() || !isConnected}
                  >
                    <Send size={18} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Add typing indicator */}
            <TypingIndicator users={users} channelId={activeChannel} />
          </>
        )}
      </div>
    </div>
  );
};

export default Messages;