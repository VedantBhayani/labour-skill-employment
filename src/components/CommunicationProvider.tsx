import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from "@/hooks/use-toast";
import { websocketService, WebSocketMessage, ConnectionStatus } from "@/lib/websocketService";
import { notificationService } from "@/lib/notificationService";
import { realTimeService, MOCK_MODE } from "@/lib/realTimeService";

// Define types
export interface User {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  role: string;
  department: string;
}

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  isEdited: boolean;
}

export interface Channel {
  id: string;
  name: string;
  type: 'department' | 'team' | 'direct';
  members: string[];
  description?: string;
  isPrivate?: boolean;
}

export interface Notification {
  id: string;
  type: 'message' | 'task' | 'meeting' | 'document' | 'mention';
  content: string;
  timestamp: string;
  isRead: boolean;
  senderId: string;
  channelId?: string;
  taskId?: string;
  meetingId?: string;
  documentId?: string;
  messageId?: string;
  additionalInfo?: string;
}

// Mock data
const MOCK_USERS: User[] = [
  {
    id: 'admin',
    name: 'Admin User',
    avatar: 'AU',
    status: 'online',
    role: 'admin',
    department: 'Administration'
  },
  {
    id: 'user1',
    name: 'John Doe',
    avatar: 'DH',
    status: 'online',
    role: 'Department Head',
    department: 'Engineering'
  },
  {
    id: 'user2',
    name: 'Jane Smith',
    avatar: 'JS',
    status: 'online',
    role: 'Manager',
    department: 'Marketing'
  },
  {
    id: 'user3',
    name: 'Robert Johnson',
    avatar: 'RJ',
    status: 'away',
    role: 'Team Lead',
    department: 'HR'
  },
  {
    id: 'user4',
    name: 'Sarah Williams',
    avatar: 'SW',
    status: 'offline',
    role: 'Department Head',
    department: 'Finance'
  },
  {
    id: 'user5',
    name: 'Michael Brown',
    avatar: 'MB',
    status: 'online',
    role: 'Department Head',
    department: 'Operations'
  },
  {
    id: 'employee1',
    name: 'Employee User',
    avatar: 'EU',
    status: 'online',
    role: 'Employee',
    department: 'Engineering'
  }
];

const MOCK_CHANNELS: Channel[] = [
  {
    id: 'channel1',
    name: 'General',
    type: 'department',
    members: ['admin', 'user1', 'user2', 'user3', 'user4', 'user5', 'employee1'],
    description: 'Channel for general discussions across all departments'
  },
  {
    id: 'channel2',
    name: 'Engineering',
    type: 'department',
    members: ['admin', 'user1', 'user2'],
    description: 'Engineering department discussions and updates'
  },
  {
    id: 'channel3',
    name: 'Marketing',
    type: 'department',
    members: ['admin', 'user2', 'user3'],
    description: 'Marketing team planning and execution'
  },
  {
    id: 'channel4',
    name: 'Project Alpha',
    type: 'team',
    members: ['admin', 'user1', 'user2', 'user4'],
    description: 'Team working on Project Alpha'
  },
  {
    id: 'testing',
    name: 'testing',
    type: 'team',
    members: ['admin', 'user1', 'employee1'],
    description: 'Testing channel'
  },
  {
    id: 'new1',
    name: 'new1',
    type: 'team',
    members: ['admin', 'user1', 'employee1'],
    description: 'New team channel for testing'
  },
  {
    id: 'directChannel1',
    name: 'Admin User, John Doe',
    type: 'direct',
    members: ['admin', 'user1']
  },
  {
    id: 'directChannel2',
    name: 'John Doe, Robert Johnson',
    type: 'direct',
    members: ['user1', 'user3']
  }
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  'channel1': [
    {
      id: 'msg1',
      channelId: 'channel1',
      senderId: 'user2',
      content: 'Hello everyone! I wanted to share the latest update on our quarterly objectives.',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      isRead: true,
      isEdited: false
    },
    {
      id: 'msg2',
      channelId: 'channel1',
      senderId: 'user1',
      content: 'Thanks Jane. This looks great. I\'ll review and provide feedback by tomorrow.',
      timestamp: new Date(Date.now() - 82800000).toISOString(),
      isRead: true,
      isEdited: false
    },
    {
      id: 'msg3',
      channelId: 'channel1',
      senderId: 'user3',
      content: 'Has anyone prepared the presentation for next weeks stakeholder meeting?',
      timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
      isRead: false,
      isEdited: false
    }
  ],
  'channel2': [
    {
      id: 'msg4',
      channelId: 'channel2',
      senderId: 'user1',
      content: 'Team, please review the latest pull requests when you get a chance.',
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      isRead: false,
      isEdited: false
    }
  ],
  'directChannel1': [
    {
      id: 'msg5',
      channelId: 'directChannel1',
      senderId: 'user2',
      content: 'Hi John, do you have a moment to discuss the project timeline?',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      isRead: false,
      isEdited: false
    }
  ],
  'testing': [
    {
      id: 'test-msg1',
      channelId: 'testing',
      senderId: 'admin',
      content: 'I am admin user',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      isRead: true,
      isEdited: false
    },
    {
      id: 'test-msg2',
      channelId: 'testing',
      senderId: 'user1',
      content: 'I am department head',
      timestamp: new Date(Date.now() - 3400000).toISOString(), // 56 minutes ago
      isRead: true,
      isEdited: false
    },
    {
      id: 'test-msg3',
      channelId: 'testing',
      senderId: 'user1',
      content: 'here we go again',
      timestamp: new Date(Date.now() - 3200000).toISOString(), // 53 minutes ago
      isRead: true,
      isEdited: false
    },
    {
      id: 'test-msg4',
      channelId: 'testing',
      senderId: 'employee1',
      content: 'i am employee',
      timestamp: new Date(Date.now() - 3000000).toISOString(), // 50 minutes ago
      isRead: true,
      isEdited: false
    }
  ]
};

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif1',
    type: 'message',
    content: 'Jane Smith mentioned you in General channel',
    timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    isRead: false,
    senderId: 'user2',
    channelId: 'channel1',
    messageId: 'msg1'
  },
  {
    id: 'notif2',
    type: 'task',
    content: 'New task assigned: Review Q3 objectives document',
    timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    isRead: false,
    senderId: 'user3',
    taskId: 'task1',
    additionalInfo: 'Due date: Next Friday'
  },
  {
    id: 'notif3',
    type: 'meeting',
    content: 'Meeting reminder: Departmental sync at 2 PM today',
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    isRead: true,
    senderId: 'user5',
    meetingId: 'meeting1'
  },
  {
    id: 'notif4',
    type: 'document',
    content: 'Sarah Williams shared a document: "Budget Proposal 2023"',
    timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    isRead: true,
    senderId: 'user4',
    documentId: 'doc1'
  },
  {
    id: 'notif5',
    type: 'mention',
    content: 'Robert Johnson mentioned you in a comment',
    timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    isRead: true,
    senderId: 'user3',
    channelId: 'channel3',
    messageId: 'msg6'
  }
];

// Define context type
interface CommunicationContextType {
  currentUser: User;
  users: User[];
  channels: Channel[];
  messages: Record<string, Message[]>;
  notifications: Notification[];
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  sendMessage: (channelId: string, content: string, messageId?: string) => Promise<void>;
  editMessage: (messageId: string, channelId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string, channelId: string) => Promise<void>;
  markMessageAsRead: (messageId: string, channelId: string) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  createChannel: (name: string, type: 'department' | 'team' | 'direct', members: string[], description?: string, isPrivate?: boolean) => Promise<string>;
  joinChannel: (channelId: string) => Promise<boolean>;
  leaveChannel: (channelId: string) => Promise<boolean>;
  switchUser: (userId: string) => boolean;
  clearChannelMessages: (channelId: string) => void;
  startTyping: (channelId: string) => void;
  stopTyping: (channelId: string) => void;
  typingUsers: Record<string, string[]>;
  enablePushNotifications: () => Promise<boolean>;
  disablePushNotifications: () => Promise<boolean>;
  pushNotificationsEnabled: boolean;
  resetLocalStorage: () => void;
  getLocalStorageInfo: () => { channels: Channel[], messages: Record<string, Message[]> };
  markChannelAsRead: (channelId: string) => void;
}

// Create context
const CommunicationContext = createContext<CommunicationContextType | undefined>(undefined);

// Provider component
export const CommunicationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use admin as default user for better testing
  const adminUser = MOCK_USERS.find(user => user.id === 'admin') || MOCK_USERS[0];
  
  // State
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User>(adminUser);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState<boolean>(false);

  // Load channels and messages from localStorage on initial load
  useEffect(() => {
    try {
      // Load channels
      const savedChannels = localStorage.getItem('channels');
      if (savedChannels) {
        setChannels(JSON.parse(savedChannels));
      } else {
        // First time loading, save the mock channels
        setChannels(MOCK_CHANNELS);
        localStorage.setItem('channels', JSON.stringify(MOCK_CHANNELS));
      }

      // Load messages
      const savedMessages = localStorage.getItem('messages');
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        // First time loading, save the mock messages
        setMessages(MOCK_MESSAGES);
        localStorage.setItem('messages', JSON.stringify(MOCK_MESSAGES));
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      // Fall back to mock data if localStorage fails
      setChannels(MOCK_CHANNELS);
      setMessages(MOCK_MESSAGES);
    }
  }, []);

  // Save channels to localStorage whenever they change
  useEffect(() => {
    if (channels.length > 0) {
      try {
        localStorage.setItem('channels', JSON.stringify(channels));
      } catch (error) {
        console.error('Error saving channels to localStorage:', error);
      }
    }
  }, [channels]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(messages).length > 0) {
      try {
        localStorage.setItem('messages', JSON.stringify(messages));
      } catch (error) {
        console.error('Error saving messages to localStorage:', error);
      }
    }
  }, [messages]);

  // Initialize real-time service on first render
  useEffect(() => {
    // Initialize the real-time service
    realTimeService.initialize({
      userId: currentUser.id,
      authToken: 'dummy-token', // In production, use a real token
      enablePushNotifications: pushNotificationsEnabled,
      onConnectionStatusChange: (status) => {
        console.log('WebSocket connection status:', status);
        setConnectionStatus(status);
        setIsConnected(status === 'connected');
      },
      onMessageReceived: (message) => {
        console.log('Message received:', message);
        
        // Special handling for clear channel messages
        if (message._clearChannel && message.channelId) {
          // Clear the messages for this channel
          setMessages(prev => ({
            ...prev,
            [message.channelId]: []
          }));
          
          // Show toast to inform user
          toast({
            title: "Channel Cleared",
            description: `All messages in this channel have been cleared.`
          });
          
          return;
        }
        
        // Regular message handling
        if (message.channelId && message.content) {
          setMessages(prev => {
            const channelMessages = prev[message.channelId] || [];
            
            // Check if this message already exists to prevent duplicates
            if (channelMessages.some(msg => msg.id === message.id)) {
              return prev;
            }
            
            return {
              ...prev,
              [message.channelId]: [...channelMessages, message]
            };
          });
        }
      },
      onUserStatusChange: (userId, status) => {
        console.log('User status changed:', userId, status);
        
        // Update user status in the users state
        setUsers(prev => 
          prev.map(user => 
            user.id === userId 
              ? {...user, status} 
              : user
          )
        );
      },
      onNotificationReceived: (notification) => {
        console.log('Notification received:', notification);
        
        // Add the notification to the notifications state
        setNotifications(prev => [notification, ...prev]);
      }
    });
    
    // Cleanup on unmount
    return () => {
      realTimeService.dispose();
    };
  }, []); // Only run on initial mount

  // Update real-time service when user changes
  useEffect(() => {
    realTimeService.updateCredentials(currentUser.id, 'dummy-token');
  }, [currentUser.id]);

  // Send a message to a channel
  const sendMessage = async (channelId: string, content: string, messageId?: string): Promise<void> => {
    // Find the channel
    const channel = channels.find(c => c.id === channelId);
    if (!channel) {
      toast({
        title: "Error",
        description: "Channel not found.",
        variant: "destructive",
      });
      throw new Error('Channel not found');
    }
    
    // Create new message with provided ID or generate a new one
    const newMessage: Message = {
      id: messageId || uuidv4(),
      channelId,
      senderId: currentUser.id,
      content,
      timestamp: new Date().toISOString(),
      isRead: false,
      isEdited: false
    };

    // Add message to state locally for immediate feedback
    setMessages(prevMessages => {
      const channelMessages = [...(prevMessages[channelId] || [])];
      // Check if this message already exists (by ID) to prevent duplicates
      if (channelMessages.some(msg => msg.id === newMessage.id)) {
        console.log(`Message with ID ${newMessage.id} already exists, not adding duplicate`);
        return prevMessages;
      }
      return {
        ...prevMessages,
        [channelId]: [...channelMessages, newMessage]
      };
    });
    
    // Send message via WebSocket
    websocketService.send('MESSAGE', {
      message: newMessage
    });
    
    // Stop typing indicator when message is sent
    stopTyping(channelId);
  };

  // Handle typing indicators
  const startTyping = (channelId: string) => {
    websocketService.send('TYPING', {
      channelId,
      userId: currentUser.id,
      isTyping: true
    });
  };
  
  const stopTyping = (channelId: string) => {
    websocketService.send('TYPING', {
      channelId,
      userId: currentUser.id,
      isTyping: false
    });
  };

  // Add function to switch users
  const switchUser = (userId: string) => {
    // First check if the user exists
    let user = users.find(u => u.id === userId);
    
    // If we don't find the user but it looks like a custom ID, create a temp user
    if (!user && userId.startsWith('employee')) {
      // Create a new employee user
      user = {
        id: userId,
        name: 'Employee User',
        avatar: 'EU',
        status: 'online' as const,
        role: 'Employee',
        department: 'Engineering'
      };
      
      // Add the new user to our users array if it doesn't exist yet
      setUsers(prevUsers => {
        if (prevUsers.some(u => u.id === userId)) {
          return prevUsers;
        }
        return [...prevUsers, user!];
      });
      
      // Also add them to relevant channels if not already a member
      setChannels(prevChannels => 
        prevChannels.map(channel => {
          if ((channel.id === 'testing' || channel.id === 'channel1') 
              && !channel.members.includes(userId)) {
            return {
              ...channel,
              members: [...channel.members, userId]
            };
          }
          return channel;
        })
      );
    }
    
    if (user) {
      // Update current user state
      setCurrentUser({...user});
      
      // Notify the user
      toast({
        title: "User Switched",
        description: `Now logged in as ${user.name} (${user.role})`,
      });
      
      // Return true to indicate successful switch
      return true;
    }
    
    // Return false if switch failed
    return false;
  };

  // Check if push notifications are enabled
  useEffect(() => {
    const checkPushNotifications = async () => {
      const permissionStatus = await notificationService.getPermissionStatus();
      setPushNotificationsEnabled(permissionStatus === 'granted');
    };
    
    checkPushNotifications();
    
    // Listen for permission changes
    notificationService.onPermissionChange((permission) => {
      setPushNotificationsEnabled(permission === 'granted');
    });
  }, []);
  
  // Enable push notifications
  const enablePushNotifications = async (): Promise<boolean> => {
    const permission = await notificationService.requestPermission();
    setPushNotificationsEnabled(permission === 'granted');
    return permission === 'granted';
  };
  
  // Disable push notifications
  const disablePushNotifications = async (): Promise<boolean> => {
    const success = await notificationService.unsubscribe();
    if (success) {
      setPushNotificationsEnabled(false);
    }
    return success;
  };

  // Simulate connection issues occasionally
  useEffect(() => {
    const simulateConnectionIssues = () => {
      // 5% chance of disconnection every minute
      const connectionCheck = setInterval(() => {
        if (Math.random() < 0.05) {
          setIsConnected(false);
          toast({
            title: "Connection lost",
            description: "You've been disconnected from the communication service.",
            variant: "destructive",
          });
        }
      }, 60000);

      return () => clearInterval(connectionCheck);
    };

    // Uncomment to simulate connection issues
    // return simulateConnectionIssues();
  }, []);

  // Handle editing a message
  const editMessage = async (messageId: string, channelId: string, newContent: string): Promise<void> => {
    if (!isConnected) {
      toast({
        title: "Error",
        description: "Cannot edit message while disconnected.",
        variant: "destructive",
      });
      throw new Error('Not connected');
    }

    // Update message
    setMessages(prevMessages => {
      const channelMessages = [...(prevMessages[channelId] || [])];
      const messageIndex = channelMessages.findIndex(msg => msg.id === messageId);
      
      if (messageIndex === -1) return prevMessages;

      // Only allow editing own messages
      if (channelMessages[messageIndex].senderId !== currentUser.id) {
        toast({
          title: "Permission Denied",
          description: "You can only edit your own messages.",
          variant: "destructive",
        });
        throw new Error('Cannot edit messages from other users');
      }

      channelMessages[messageIndex] = {
        ...channelMessages[messageIndex],
        content: newContent,
        isEdited: true
      };

      return {
        ...prevMessages,
        [channelId]: channelMessages
      };
    });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
  };

  // Handle deleting a message
  const deleteMessage = async (messageId: string, channelId: string): Promise<void> => {
    if (!isConnected) {
      toast({
        title: "Error",
        description: "Cannot delete message while disconnected.",
        variant: "destructive",
      });
      throw new Error('Not connected');
    }

    // Delete message
    setMessages(prevMessages => {
      const channelMessages = [...(prevMessages[channelId] || [])];
      const messageIndex = channelMessages.findIndex(msg => msg.id === messageId);
      
      if (messageIndex === -1) return prevMessages;

      // Only allow deleting own messages
      if (channelMessages[messageIndex].senderId !== currentUser.id) {
        toast({
          title: "Permission Denied",
          description: "You can only delete your own messages.",
          variant: "destructive",
        });
        throw new Error('Cannot delete messages from other users');
      }

      channelMessages.splice(messageIndex, 1);

      return {
        ...prevMessages,
        [channelId]: channelMessages
      };
    });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
  };

  // Mark message as read
  const markMessageAsRead = (messageId: string, channelId: string): void => {
    setMessages(prevMessages => {
      const channelMessages = [...(prevMessages[channelId] || [])];
      const messageIndex = channelMessages.findIndex(msg => msg.id === messageId);
      
      if (messageIndex === -1) return prevMessages;

      channelMessages[messageIndex] = {
        ...channelMessages[messageIndex],
        isRead: true
      };

      return {
        ...prevMessages,
        [channelId]: channelMessages
      };
    });
  };

  // Mark notification as read
  const markNotificationAsRead = (notificationId: string): void => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true } 
          : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = (): void => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ ...notification, isRead: true }))
    );
  };

  // Delete a notification
  const deleteNotification = (notificationId: string): void => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== notificationId)
    );
  };

  // Create a new channel
  const createChannel = async (name: string, type: 'department' | 'team' | 'direct', members: string[], description?: string, isPrivate?: boolean): Promise<string> => {
    if (!isConnected && !MOCK_MODE) {
      toast({
        title: "Error",
        description: "Cannot create channel while disconnected.",
        variant: "destructive",
      });
      throw new Error('Not connected');
    }

    try {
      // Create new channel with a unique ID
      const channelId = uuidv4();
      const newChannel: Channel = {
        id: channelId,
        name,
        type,
        members,
        description,
        isPrivate
      };

      // Update channels state
      const updatedChannels = [...channels, newChannel];
      setChannels(updatedChannels);

      // Initialize empty message array for new channel
      const updatedMessages = {
        ...messages,
        [newChannel.id]: []
      };
      setMessages(updatedMessages);

      // Explicitly save to localStorage
      try {
        localStorage.setItem('channels', JSON.stringify(updatedChannels));
        localStorage.setItem('messages', JSON.stringify(updatedMessages));
        console.log('Successfully saved new channel to localStorage:', newChannel.name);
      } catch (storageError) {
        console.error('Failed to save channel to localStorage:', storageError);
        // Continue anyway since we've updated the state
      }

      // Create notification for channel members
      if (newChannel.type !== 'direct') {
        const newNotifications = newChannel.members
          .filter(memberId => memberId !== currentUser.id)
          .map(memberId => ({
            id: uuidv4(),
            type: 'message' as const,
            content: `${currentUser.name} created a new channel: ${newChannel.name}`,
            timestamp: new Date().toISOString(),
            isRead: false,
            senderId: currentUser.id,
            channelId: newChannel.id
          }));

        if (newNotifications.length > 0) {
          setNotifications(prev => [...newNotifications, ...prev]);
        }
      }

      toast({
        title: "Channel Created",
        description: `Channel '${newChannel.name}' has been created successfully.`,
      });

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      return newChannel.id;
    } catch (error) {
      console.error('Failed to create channel:', error);
      toast({
        title: "Error",
        description: "Failed to create the channel. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Reconnect function
  const reconnect = async (): Promise<void> => {
    // Simulate reconnection attempt
    toast({
      title: "Reconnecting...",
      description: "Attempting to reconnect to the communication service.",
    });
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsConnected(true);
    
    toast({
      title: "Connected",
      description: "Successfully reconnected to the communication service.",
    });
  };

  // Clear channel messages function
  const clearChannelMessages = (channelId: string): void => {
    // Update local state
    setMessages(prevMessages => ({
      ...prevMessages,
      [channelId]: []
    }));
    
    // Broadcast clear action via WebSocket so all clients clear this channel
    websocketService.send('CLEAR_CHANNEL', {
      channelId,
      clearedBy: currentUser.id,
      timestamp: new Date().toISOString()
    });
    
    toast({
      title: "Channel Cleared",
      description: `All messages in channel have been cleared.`,
    });
  };

  // Mark all messages in a channel as read
  const markChannelAsRead = (channelId: string): void => {
    setMessages(prevMessages => {
      const channelMessages = prevMessages[channelId] || [];
      
      // Nothing to update if no messages or all messages are read
      if (channelMessages.length === 0 || 
          !channelMessages.some(msg => !msg.isRead && msg.senderId !== currentUser.id)) {
        return prevMessages;
      }
      
      // Mark all messages as read
      const updatedMessages = channelMessages.map(message => 
        !message.isRead && message.senderId !== currentUser.id
          ? { ...message, isRead: true }
          : message
      );
      
      // Update state with read messages
      return {
        ...prevMessages,
        [channelId]: updatedMessages
      };
    });
    
    // Broadcast that user has read all messages in this channel
    websocketService.send('READ_RECEIPT', {
      channelId,
      userId: currentUser.id,
      timestamp: new Date().toISOString()
    });
  };

  // Implement the joinChannel method
  const joinChannel = async (channelId: string): Promise<boolean> => {
    if (!isConnected) {
      toast({
        title: "Error",
        description: "Cannot join channel while disconnected.",
        variant: "destructive",
      });
      return false;
    }

    // Find the channel
    const channel = channels.find(c => c.id === channelId);
    if (!channel) {
      toast({
        title: "Error",
        description: "Channel not found.",
        variant: "destructive",
      });
      return false;
    }

    // Check if already a member
    if (channel.members.includes(currentUser.id)) {
      toast({
        title: "Info",
        description: "You are already a member of this channel.",
      });
      return true;
    }

    // Add user to channel members
    const updatedChannel = {
      ...channel,
      members: [...channel.members, currentUser.id]
    };

    // Update channels state
    setChannels(prevChannels => 
      prevChannels.map(c => 
        c.id === channelId ? updatedChannel : c
      )
    );

    // Send join notification
    const joinNotification: Notification = {
      id: uuidv4(),
      type: 'message',
      content: `${currentUser.name} joined the channel ${channel.name}`,
      timestamp: new Date().toISOString(),
      isRead: false,
      senderId: currentUser.id,
      channelId
    };

    setNotifications(prev => [joinNotification, ...prev]);

    // Send notification via WebSocket
    websocketService.send('NOTIFICATION', {
      notification: joinNotification,
      channelId
    });

    toast({
      title: "Success",
      description: `You have joined the ${channel.name} channel.`,
    });

    return true;
  };

  // Implement the leaveChannel method
  const leaveChannel = async (channelId: string): Promise<boolean> => {
    if (!isConnected) {
      toast({
        title: "Error",
        description: "Cannot leave channel while disconnected.",
        variant: "destructive",
      });
      return false;
    }

    // Find the channel
    const channel = channels.find(c => c.id === channelId);
    if (!channel) {
      toast({
        title: "Error",
        description: "Channel not found.",
        variant: "destructive",
      });
      return false;
    }

    // Check if a member
    if (!channel.members.includes(currentUser.id)) {
      toast({
        title: "Info",
        description: "You are not a member of this channel.",
      });
      return false;
    }

    // Remove user from channel members
    const updatedChannel = {
      ...channel,
      members: channel.members.filter(id => id !== currentUser.id)
    };

    // Update channels state
    setChannels(prevChannels => 
      prevChannels.map(c => 
        c.id === channelId ? updatedChannel : c
      )
    );

    // Send leave notification
    const leaveNotification: Notification = {
      id: uuidv4(),
      type: 'message',
      content: `${currentUser.name} left the channel ${channel.name}`,
      timestamp: new Date().toISOString(),
      isRead: false,
      senderId: currentUser.id,
      channelId
    };

    setNotifications(prev => [leaveNotification, ...prev]);

    // Send notification via WebSocket
    websocketService.send('NOTIFICATION', {
      notification: leaveNotification,
      channelId
    });

    toast({
      title: "Success",
      description: `You have left the ${channel.name} channel.`,
    });

    return true;
  };

  // Debug function to reset localStorage data
  const resetLocalStorage = (): void => {
    try {
      localStorage.removeItem('channels');
      localStorage.removeItem('messages');
      
      // Reset to mock data
      setChannels(MOCK_CHANNELS);
      setMessages(MOCK_MESSAGES);
      
      // Save mock data
      localStorage.setItem('channels', JSON.stringify(MOCK_CHANNELS));
      localStorage.setItem('messages', JSON.stringify(MOCK_MESSAGES));
      
      toast({
        title: "Storage Reset",
        description: "Channels and messages have been reset to defaults",
      });
    } catch (error) {
      console.error('Error resetting localStorage:', error);
      toast({
        title: "Error",
        description: "Failed to reset storage. See console for details.",
        variant: "destructive",
      });
    }
  };
  
  // Debug function to get localStorage information
  const getLocalStorageInfo = () => {
    try {
      const channelsData = localStorage.getItem('channels');
      const messagesData = localStorage.getItem('messages');
      
      return {
        channels: channelsData ? JSON.parse(channelsData) : [],
        messages: messagesData ? JSON.parse(messagesData) : {}
      };
    } catch (error) {
      console.error('Error getting localStorage info:', error);
      return { channels: [], messages: {} };
    }
  };

  // Context value
  const contextValue: CommunicationContextType = {
    currentUser,
    users,
    channels,
    messages,
    notifications,
    isConnected,
    connectionStatus,
    sendMessage,
    editMessage,
    deleteMessage,
    markMessageAsRead,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    createChannel,
    switchUser,
    clearChannelMessages,
    startTyping,
    stopTyping,
    typingUsers,
    enablePushNotifications,
    disablePushNotifications,
    pushNotificationsEnabled,
    joinChannel,
    leaveChannel,
    resetLocalStorage,
    getLocalStorageInfo,
    markChannelAsRead
  };

  return (
    <CommunicationContext.Provider value={contextValue}>
      {children}
    </CommunicationContext.Provider>
  );
};

// Custom hook for using the communication context
export const useCommunication = (): CommunicationContextType => {
  const context = useContext(CommunicationContext);
  if (context === undefined) {
    throw new Error('useCommunication must be used within a CommunicationProvider');
  }
  return context;
}; 