import React, { useState, useEffect } from "react";
import { MessageSquare, Search, Plus, ChevronRight, ThumbsUp, MessageCircle, Filter, Calendar, Pin, Star, AlertCircle, Eye, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCommunication, User } from "@/components/CommunicationProvider";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

// Types for forums
interface ForumCategory {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  categoryId: string;
  timestamp: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  tags: string[];
}

interface ForumComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  timestamp: string;
  isEdited: boolean;
  likeCount: number;
  parentId?: string;
}

const Discussions = () => {
  const { currentUser, users, isConnected } = useCommunication();
  const { toast } = useToast();
  
  // Local state
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activePost, setActivePost] = useState<ForumPost | null>(null);
  const [commentContent, setCommentContent] = useState("");
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("");
  const [newPostTags, setNewPostTags] = useState("");

  // Mock data for forum
  const [categories] = useState<ForumCategory[]>([
    { id: "cat1", name: "Announcements", description: "Important updates for all departments", color: "bg-blue-500" },
    { id: "cat2", name: "Engineering", description: "Engineering department discussions", color: "bg-green-500" },
    { id: "cat3", name: "Marketing", description: "Marketing team discussions", color: "bg-purple-500" },
    { id: "cat4", name: "HR", description: "Human Resources discussions", color: "bg-yellow-500" },
    { id: "cat5", name: "Finance", description: "Finance department discussions", color: "bg-red-500" },
    { id: "cat6", name: "IT Support", description: "Technical support questions", color: "bg-indigo-500" },
    { id: "cat7", name: "General", description: "General interdepartmental discussions", color: "bg-gray-500" },
  ]);

  const [posts, setPosts] = useState<ForumPost[]>([
    {
      id: "post1",
      title: "Welcome to our new interdepartmental discussion forum!",
      content: "This forum has been created to facilitate communication between all departments. Feel free to share ideas, ask questions, and collaborate on projects.",
      authorId: "user5",
      categoryId: "cat1",
      timestamp: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
      isPinned: true,
      isLocked: false,
      viewCount: 156,
      likeCount: 42,
      commentCount: 8,
      tags: ["welcome", "announcement"]
    },
    {
      id: "post2",
      title: "Q3 Objectives Overview - Input needed from all departments",
      content: "As we approach Q3, we need to finalize our objectives. Each department should provide their top 3 priorities by next Friday.",
      authorId: "user4",
      categoryId: "cat1",
      timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      isPinned: true,
      isLocked: false,
      viewCount: 98,
      likeCount: 24,
      commentCount: 15,
      tags: ["planning", "objectives", "q3"]
    },
    {
      id: "post3",
      title: "New product launch timeline discussion",
      content: "Let's discuss the timeline for our upcoming product launch. Engineering and Marketing teams, please share your current progress and any potential blockers.",
      authorId: "user2",
      categoryId: "cat2",
      timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      isPinned: false,
      isLocked: false,
      viewCount: 76,
      likeCount: 18,
      commentCount: 12,
      tags: ["product", "launch", "timeline"]
    },
    {
      id: "post4",
      title: "Marketing campaign results for Q2",
      content: "Here are the results of our Q2 marketing campaigns. We've seen a 15% increase in lead generation compared to Q1.",
      authorId: "user2",
      categoryId: "cat3",
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      isPinned: false,
      isLocked: false,
      viewCount: 42,
      likeCount: 8,
      commentCount: 5,
      tags: ["marketing", "results", "q2"]
    },
    {
      id: "post5",
      title: "Updated vacation policy - Please review",
      content: "HR has updated the company vacation policy. Please review the changes and provide feedback by end of week.",
      authorId: "user3",
      categoryId: "cat4",
      timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
      isPinned: false,
      isLocked: false,
      viewCount: 65,
      likeCount: 12,
      commentCount: 9,
      tags: ["hr", "policy", "vacation"]
    },
  ]);

  const [comments, setComments] = useState<ForumComment[]>([
    {
      id: "comment1",
      postId: "post1",
      authorId: "user1",
      content: "This is a great initiative! Looking forward to more interdepartmental collaboration.",
      timestamp: new Date(Date.now() - 518400000).toISOString(), // 6 days ago
      isEdited: false,
      likeCount: 5
    },
    {
      id: "comment2",
      postId: "post1",
      authorId: "user2",
      content: "Agreed! The marketing team is excited to work more closely with all departments.",
      timestamp: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
      isEdited: false,
      likeCount: 3
    },
    {
      id: "comment3",
      postId: "post2",
      authorId: "user1",
      content: "Engineering has prepared our objectives. We'll be focusing on platform stability, new features for the mobile app, and API improvements.",
      timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      isEdited: true,
      likeCount: 7
    },
    {
      id: "comment4",
      postId: "post2",
      authorId: "user2",
      content: "Marketing will prioritize customer acquisition, conversion rate optimization, and brand awareness campaigns.",
      timestamp: new Date(Date.now() - 129600000).toISOString(), // 1.5 days ago
      isEdited: false,
      likeCount: 4
    },
  ]);

  // Filter posts based on active tab, search query, and selected category
  const filteredPosts = posts.filter((post) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pinned" && post.isPinned) ||
      (activeTab === "mine" && post.authorId === currentUser.id);

    const matchesSearch =
      !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || post.categoryId === selectedCategory;

    return matchesTab && matchesSearch && matchesCategory;
  });

  // Sort posts by pinned status and date
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    // First sort by pinned status
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    // Then sort by date (newest first)
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Handle viewing a post
  const handleViewPost = (post: ForumPost) => {
    setActivePost(post);
  };

  // Get post comments
  const getPostComments = (postId: string) => {
    return comments.filter(comment => comment.postId === postId);
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = parseISO(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return timestamp;
    }
  };

  // Get user info
  const getUserInfo = (userId: string) => {
    return users.find(user => user.id === userId) || {
      name: "Unknown User",
      avatar: "??",
      department: "Unknown"
    };
  };

  // Handle adding a comment
  const handleAddComment = () => {
    if (!commentContent.trim() || !activePost) return;
    
    // Create a new comment
    const newComment: ForumComment = {
      id: `comment-${Date.now()}`,
      postId: activePost.id,
      authorId: currentUser.id,
      content: commentContent,
      timestamp: new Date().toISOString(),
      isEdited: false,
      likeCount: 0
    };
    
    // In a real app, this would call an API
    // For demo purposes, we'll update the state directly
    setComments([...comments, newComment]);
    
    // Update post comment count
    const updatedPosts = posts.map(post => 
      post.id === activePost.id 
        ? { ...post, commentCount: post.commentCount + 1 } 
        : post
    );
    
    // Reset input and update state
    setCommentContent("");
    setPosts(updatedPosts);
    
    // Show toast notification
    toast({
      title: "Comment Added",
      description: "Your comment has been added to the discussion.",
    });
  };

  // Handle creating a new post
  const handleCreatePost = () => {
    if (!newPostTitle.trim() || !newPostContent.trim() || !newPostCategory) return;
    
    // Create a new post object
    const newPost: ForumPost = {
      id: `post-${Date.now()}`, // In real app, this would be generated by the server
      title: newPostTitle,
      content: newPostContent,
      authorId: currentUser.id,
      categoryId: newPostCategory,
      timestamp: new Date().toISOString(),
      isPinned: false,
      isLocked: false,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      tags: newPostTags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
    };
    
    // In a real app, we would make an API call here
    // For now, directly add to our posts state
    setPosts([...posts, newPost]);
    
    // Reset form data
    setShowNewPostDialog(false);
    setNewPostTitle("");
    setNewPostContent("");
    setNewPostCategory("");
    setNewPostTags("");
    
    // Show confirmation toast
    toast({
      title: "Post Created",
      description: "Your discussion has been published successfully.",
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">Discussion Forum</h1>
          <p className="text-muted-foreground mt-1">
            Connect and collaborate with colleagues across departments
          </p>
        </div>
        <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Discussion
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Discussion</DialogTitle>
              <DialogDescription>
                Start a new discussion topic to collaborate with your colleagues
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="title" className="text-sm font-medium">Title</label>
                <Input
                  id="title"
                  placeholder="Enter a descriptive title"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="category" className="text-sm font-medium">Category</label>
                <Select value={newPostCategory} onValueChange={setNewPostCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="content" className="text-sm font-medium">Content</label>
                <Textarea
                  id="content"
                  placeholder="Write your discussion topic here..."
                  rows={6}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="tags" className="text-sm font-medium">Tags</label>
                <Input
                  id="tags"
                  placeholder="Enter tags separated by commas"
                  value={newPostTags}
                  onChange={(e) => setNewPostTags(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Tags help others find your discussion more easily
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewPostDialog(false)}>Cancel</Button>
              <Button onClick={handleCreatePost}>Post Discussion</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!isConnected && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection lost</AlertTitle>
          <AlertDescription>
            You've been disconnected from the discussion forum.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Categories</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <button
                  className={`w-full flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors text-left ${
                    !selectedCategory ? "bg-primary/10 font-medium" : ""
                  }`}
                  onClick={() => setSelectedCategory(null)}
                >
                  <span>All Categories</span>
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={`w-full flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors text-left ${
                      selectedCategory === category.id ? "bg-primary/10 font-medium" : ""
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${category.color}`} />
                      <span>{category.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Top Contributors</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {users.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{user.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.department}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3 space-y-6">
          <Card className="mb-6">
            <CardContent className="p-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search discussions..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {activePost ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {categories.find(c => c.id === activePost.categoryId) && (
                      <Badge 
                        className={`${categories.find(c => c.id === activePost.categoryId)?.color} text-white`}
                      >
                        {categories.find(c => c.id === activePost.categoryId)?.name}
                      </Badge>
                    )}
                    {activePost.isPinned && (
                      <Badge variant="outline" className="gap-1">
                        <Pin className="h-3 w-3" /> Pinned
                      </Badge>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setActivePost(null)}
                  >
                    Back to List
                  </Button>
                </div>
                <CardTitle className="text-2xl">{activePost.title}</CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  {activePost.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {getUserInfo(activePost.authorId).avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {getUserInfo(activePost.authorId).name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimestamp(activePost.timestamp)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none dark:prose-invert">
                  <p>{activePost.content}</p>
                </div>
                <div className="flex items-center gap-4 mt-6">
                  <Button variant="outline" size="sm" className="gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    Like ({activePost.likeCount})
                  </Button>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    {activePost.viewCount} views
                  </div>
                </div>
              </CardContent>
              <Separator />
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Comments ({getPostComments(activePost.id).length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-6">
                    {getPostComments(activePost.id).length === 0 ? (
                      <div className="text-center py-8">
                        <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No comments yet</h3>
                        <p className="text-sm text-muted-foreground">
                          Be the first to comment on this discussion
                        </p>
                      </div>
                    ) : (
                      getPostComments(activePost.id).map((comment) => (
                        <div key={comment.id} className="border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {getUserInfo(comment.authorId).avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">
                                  {getUserInfo(comment.authorId).name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatTimestamp(comment.timestamp)}
                                  {comment.isEdited && <span className="ml-1">(edited)</span>}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {getUserInfo(comment.authorId).department}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              Like ({comment.likeCount})
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                              Reply
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                <div className="mt-6">
                  <Textarea
                    placeholder="Write a comment..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    className="mb-2"
                  />
                  <Button 
                    onClick={handleAddComment}
                    disabled={!commentContent.trim()}
                  >
                    Add Comment
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All Discussions</TabsTrigger>
                  <TabsTrigger value="pinned">Pinned</TabsTrigger>
                  <TabsTrigger value="mine">My Discussions</TabsTrigger>
                </TabsList>

                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {sortedPosts.length} {sortedPosts.length === 1 ? "discussion" : "discussions"}
                  </div>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                </div>

                <TabsContent value={activeTab} className="m-0 space-y-4">
                  {sortedPosts.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No discussions found</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {activeTab === "all"
                          ? "There are no discussions in this category yet"
                          : activeTab === "pinned"
                          ? "There are no pinned discussions yet"
                          : "You haven't created any discussions yet"}
                      </p>
                      <Button onClick={() => setShowNewPostDialog(true)}>
                        Start a Discussion
                      </Button>
                    </div>
                  ) : (
                    sortedPosts.map((post) => (
                      <Card key={post.id} className="overflow-hidden">
                        <div className="flex">
                          {/* Left side - voting and stats */}
                          <div className="p-4 flex flex-col items-center justify-center bg-muted/40 w-20">
                            <Button variant="ghost" size="sm" className="gap-1">
                              <ThumbsUp className="h-4 w-4" />
                              {post.likeCount}
                            </Button>
                            <div className="text-xs text-muted-foreground mt-2">
                              <div className="flex items-center gap-1 mb-1">
                                <MessageCircle className="h-3 w-3" />
                                {post.commentCount}
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {post.viewCount}
                              </div>
                            </div>
                          </div>
                          
                          {/* Right side - content */}
                          <div className="flex-1 p-4">
                            <div className="flex flex-wrap gap-2 mb-2">
                              {categories.find(c => c.id === post.categoryId) && (
                                <Badge 
                                  className={`${categories.find(c => c.id === post.categoryId)?.color} text-white`}
                                >
                                  {categories.find(c => c.id === post.categoryId)?.name}
                                </Badge>
                              )}
                              {post.isPinned && (
                                <Badge variant="outline" className="gap-1">
                                  <Pin className="h-3 w-3" /> Pinned
                                </Badge>
                              )}
                              {post.isLocked && (
                                <Badge variant="destructive" className="gap-1">
                                  <Lock className="h-3 w-3" /> Locked
                                </Badge>
                              )}
                            </div>
                            
                            <h3 className="text-lg font-semibold mb-2 hover:text-primary transition-colors">
                              <button 
                                onClick={() => handleViewPost(post)}
                                className="text-left hover:underline"
                              >
                                {post.title}
                              </button>
                            </h3>
                            
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {post.content}
                            </p>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                              {post.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback>
                                    {getUserInfo(post.authorId).avatar}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-xs">
                                    <span className="font-medium">{getUserInfo(post.authorId).name}</span>
                                    <span className="text-muted-foreground"> • {formatTimestamp(post.timestamp)}</span>
                                  </p>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewPost(post)}
                              >
                                Read More
                                <ChevronRight className="ml-1 h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Discussions; 