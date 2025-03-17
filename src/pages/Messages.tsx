
import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { 
  MessageSquare, 
  Search, 
  Send, 
  Users, 
  Plus,
  Paperclip,
  Smile,
  User,
  MoreHorizontal,
  Pin,
  Star,
  Archive,
  Info
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
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

const channelsData = [
  { id: "general", name: "General", unread: 3 },
  { id: "hr", name: "HR Announcements", unread: 0 },
  { id: "development", name: "Development Team", unread: 5 },
  { id: "marketing", name: "Marketing", unread: 2 },
  { id: "sales", name: "Sales Team", unread: 0 },
  { id: "finance", name: "Finance Department", unread: 1 },
];

const directMessagesData = [
  { id: "user1", name: "Sarah Johnson", status: "online", unread: 2, avatar: "SJ" },
  { id: "user2", name: "Michael Lee", status: "offline", unread: 0, avatar: "ML" },
  { id: "user3", name: "Emma Davis", status: "online", unread: 4, avatar: "ED" },
  { id: "user4", name: "Alex Chen", status: "away", unread: 0, avatar: "AC" },
  { id: "user5", name: "Jennifer Williams", status: "online", unread: 0, avatar: "JW" },
];

const conversationData = [
  { 
    id: "msg1", 
    sender: "Sarah Johnson", 
    senderAvatar: "SJ", 
    content: "Hi team, I've updated the quarterly report. Please review when you get a chance.", 
    timestamp: "10:32 AM", 
    isMine: false 
  },
  { 
    id: "msg2", 
    sender: "You", 
    senderAvatar: "ME", 
    content: "Thanks Sarah, I'll take a look at it this afternoon.", 
    timestamp: "10:45 AM", 
    isMine: true 
  },
  { 
    id: "msg3", 
    sender: "Michael Lee", 
    senderAvatar: "ML", 
    content: "Quick question - did we get the final numbers from finance?", 
    timestamp: "11:02 AM", 
    isMine: false 
  },
  { 
    id: "msg4", 
    sender: "Sarah Johnson", 
    senderAvatar: "SJ", 
    content: "Yes, they were included in the latest version of the document I shared.", 
    timestamp: "11:15 AM", 
    isMine: false 
  },
  { 
    id: "msg5", 
    sender: "You", 
    senderAvatar: "ME", 
    content: "I see them now. The growth projections look promising.", 
    timestamp: "11:30 AM", 
    isMine: true 
  },
  { 
    id: "msg6", 
    sender: "Emma Davis", 
    senderAvatar: "ED", 
    content: "I've also added some notes on the development roadmap for next quarter. Let me know if you need any clarification.", 
    timestamp: "12:05 PM", 
    isMine: false 
  },
  { 
    id: "msg7", 
    sender: "Sarah Johnson", 
    senderAvatar: "SJ", 
    content: "Great work everyone! We'll discuss this at the next meeting on Friday.", 
    timestamp: "12:30 PM", 
    isMine: false 
  },
];

const Messages = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [activeChannel, setActiveChannel] = useState("general");
  const [channelType, setChannelType] = useState("channels"); // 'channels' or 'direct'

  const handleSendMessage = () => {
    if (message.trim()) {
      // In a real app, this would send the message
      console.log(`Sending message to ${activeChannel}: ${message}`);
      setMessage("");
    }
  };

  const getChannelDisplayName = () => {
    if (channelType === "channels") {
      return channelsData.find(channel => channel.id === activeChannel)?.name || "";
    } else {
      return directMessagesData.find(user => user.id === activeChannel)?.name || "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-5rem)] animate-fade-in flex">
        <Card className="w-72 h-full border-r rounded-none mr-6">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Messages</CardTitle>
              <Button variant="ghost" size="icon">
                <Plus size={18} />
              </Button>
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
                  {channelsData.map((channel) => (
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
                        <MessageSquare size={18} />
                        <span>{channel.name}</span>
                      </div>
                      {channel.unread > 0 && (
                        <Badge variant="secondary" className="bg-primary text-primary-foreground">
                          {channel.unread}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="direct" className="m-0">
              <ScrollArea className="h-[calc(100vh-14rem)]">
                <div className="px-2 py-2">
                  {directMessagesData.map((user) => (
                    <button
                      key={user.id}
                      className={`w-full flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors mb-1 text-left ${
                        activeChannel === user.id && channelType === "direct" ? "bg-primary/10" : ""
                      }`}
                      onClick={() => {
                        setActiveChannel(user.id);
                        setChannelType("direct");
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>{user.avatar}</AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${
                            user.status === "online" ? "bg-green-500" : 
                            user.status === "away" ? "bg-yellow-500" : "bg-gray-400"
                          }`}></div>
                        </div>
                        <span>{user.name}</span>
                      </div>
                      {user.unread > 0 && (
                        <Badge variant="secondary" className="bg-primary text-primary-foreground">
                          {user.unread}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="flex-1 flex flex-col h-full">
          <div className="border-b p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {channelType === "direct" ? (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {directMessagesData.find(user => user.id === activeChannel)?.avatar || "U"}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <MessageSquare size={20} />
              )}
              <div>
                <h2 className="font-medium">{getChannelDisplayName()}</h2>
                <p className="text-xs text-muted-foreground">
                  {channelType === "channels" ? "Channel" : "Direct Message"} • 
                  {channelType === "channels" ? " 25 members" : " Online"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Users size={18} />
              </Button>
              <Button variant="ghost" size="icon">
                <Info size={18} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="flex items-center gap-2">
                    <Pin size={16} /> Pin Channel
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2">
                    <Star size={16} /> Mark as Favorite
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2">
                    <Archive size={16} /> Archive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {conversationData.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex gap-3 ${msg.isMine ? "justify-end" : ""}`}
                >
                  {!msg.isMine && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback>{msg.senderAvatar}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[70%] ${msg.isMine ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {!msg.isMine && <p className="text-sm font-medium">{msg.sender}</p>}
                      <p className="text-xs text-muted-foreground">{msg.timestamp}</p>
                    </div>
                    <div 
                      className={`p-3 rounded-lg ${
                        msg.isMine 
                          ? "bg-primary text-primary-foreground rounded-tr-none" 
                          : "bg-muted rounded-tl-none"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                  {msg.isMine && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback>{msg.senderAvatar}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex items-end gap-2">
              <Textarea 
                placeholder="Type your message..." 
                className="min-h-24 resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="flex flex-col gap-2">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Paperclip size={18} />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Smile size={18} />
                </Button>
                <Button size="icon" className="rounded-full" onClick={handleSendMessage}>
                  <Send size={18} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
