import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  BadgeCheck,
  Briefcase,
  Building,
  Calendar,
  ChevronRight,
  Edit2,
  FileText,
  MapPin,
  Phone,
  Plus,
  User,
  Mail,
  Share2,
  Bookmark,
  BarChart2,
  Award,
  Star,
  ThumbsUp,
  MessageSquare,
  Activity,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";

const Profile = () => {
  const [skills] = useState([
    { name: "Project Management", level: 95 },
    { name: "Communication", level: 90 },
    { name: "Data Analysis", level: 85 },
    { name: "Strategic Planning", level: 85 },
    { name: "Leadership", level: 80 },
  ]);

  const [workHistory] = useState([
    {
      role: "Senior Project Manager",
      company: "TechCorp Solutions",
      period: "2019 - Present",
      description: "Leading cross-functional teams to deliver enterprise software solutions.",
    },
    {
      role: "Project Manager",
      company: "Innovative Systems Inc.",
      period: "2016 - 2019",
      description: "Managed product development lifecycle for mobile applications.",
    },
    {
      role: "Associate Project Manager",
      company: "Digital Frontiers",
      period: "2014 - 2016",
      description: "Coordinated technical projects and client communications.",
    },
  ]);

  const [education] = useState([
    {
      degree: "MBA, Business Administration",
      institution: "Stanford University",
      year: "2014",
    },
    {
      degree: "BS, Computer Science",
      institution: "University of California, Berkeley",
      year: "2012",
    },
  ]);

  const [activities] = useState([
    {
      type: "completed",
      text: "Completed Q1 Department Report",
      time: "2 days ago",
      icon: FileText,
    },
    {
      type: "comment",
      text: "Commented on Marketing Strategy Document",
      time: "3 days ago",
      icon: MessageSquare,
    },
    {
      type: "assigned",
      text: "Assigned to New Product Launch project",
      time: "1 week ago",
      icon: Briefcase,
    },
  ]);

  const [stats] = useState([
    { label: "Projects Completed", value: 24, icon: Briefcase },
    { label: "Tasks Completed", value: 137, icon: CheckIcon },
    { label: "Collaboration Score", value: 94, icon: Users },
    { label: "Performance Rating", value: 4.8, icon: Star },
  ]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your personal and professional information
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="flex items-center gap-2 transition-all hover:bg-primary/10 hover:text-primary">
            <Share2 size={14} />
            <span>Share</span>
          </Button>
          <Button size="sm" className="flex items-center gap-2 transition-all">
            <Edit2 size={14} />
            <span>Edit Profile</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/30" />
            <CardContent className="pt-0 relative">
              <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
                <Avatar className="h-32 w-32 border-4 border-background shadow-md transition-transform hover:scale-105">
                  <AvatarImage src="/avatar-placeholder.png" alt="John Doe" />
                  <AvatarFallback className="text-4xl">JD</AvatarFallback>
                </Avatar>
              </div>
              <div className="mt-20 text-center space-y-2">
                <h2 className="text-2xl font-semibold">John Doe</h2>
                <p className="text-muted-foreground">Product Manager</p>
                <div className="flex justify-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1 px-2 py-1 transition-colors">
                    <BadgeCheck size={12} className="text-primary" />
                    <span>Verified</span>
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1 px-2 py-1 transition-colors">
                    <Building size={12} className="text-primary" />
                    <span>TechCorp</span>
                  </Badge>
                </div>
              </div>
              <Separator className="my-6" />
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-muted-foreground" />
                  <span>john.doe@example.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-muted-foreground" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-muted-foreground" />
                  <span>San Francisco, CA</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-muted-foreground" />
                  <span>Joined January 2019</span>
                </div>
              </div>
              <Separator className="my-6" />
              <div className="space-y-4">
                <h3 className="font-medium">Professional Skills</h3>
                {skills.map((skill, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{skill.name}</span>
                      <span className="text-sm text-muted-foreground">{skill.level}%</span>
                    </div>
                    <Progress value={skill.level} className="h-1.5 transition-all hover:h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity size={18} />
                <span>Activity Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="flex flex-col items-center p-3 rounded-lg border bg-card/50 transition-transform hover:scale-105">
                    <stat.icon size={20} className="text-primary mb-2" />
                    <span className="text-xl font-semibold">{stat.value}</span>
                    <span className="text-xs text-muted-foreground text-center">{stat.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="overview" className="transition-all">Overview</TabsTrigger>
              <TabsTrigger value="experience" className="transition-all">Experience</TabsTrigger>
              <TabsTrigger value="activity" className="transition-all">Activity</TabsTrigger>
              <TabsTrigger value="settings" className="transition-all">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6 animate-in fade-in-50 duration-300">
              <Card className="transition-all duration-300 hover:shadow-md">
                <CardHeader>
                  <CardTitle>About Me</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-7">
                    Experienced product manager with over 8 years in the technology industry, specializing 
                    in enterprise software solutions. Passionate about creating user-centric products that 
                    solve real business problems. Strong background in agile methodologies, stakeholder 
                    management, and cross-functional team leadership.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {["Product Strategy", "Agile", "User Experience", "Market Analysis", "Enterprise Software"].map((tag, i) => (
                      <Badge key={i} variant="secondary" className="transition-colors hover:bg-secondary/80">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="transition-all duration-300 hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Current Projects</CardTitle>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <span>View All</span>
                    <ChevronRight size={16} />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { 
                        name: "Enterprise Dashboard Redesign", 
                        progress: 75, 
                        status: "In Progress",
                        deadline: "Mar 25, 2023" 
                      },
                      { 
                        name: "Mobile App Feature Extension", 
                        progress: 40, 
                        status: "In Progress",
                        deadline: "Apr 12, 2023" 
                      },
                      { 
                        name: "Customer Feedback Implementation", 
                        progress: 90, 
                        status: "Review",
                        deadline: "Mar 15, 2023" 
                      }
                    ].map((project, index) => (
                      <div key={index} className="rounded-lg border p-4 group hover:border-primary/50 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium group-hover:text-primary transition-colors">{project.name}</h4>
                            <p className="text-sm text-muted-foreground">Due {project.deadline}</p>
                          </div>
                          <Badge variant={
                            project.status === "In Progress" ? "default" : 
                            project.status === "Review" ? "secondary" : "outline"
                          }>
                            {project.status}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-2 transition-all group-hover:h-2.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="experience" className="space-y-6 animate-in fade-in-50 duration-300">
              <Card className="transition-all duration-300 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase size={18} />
                    <span>Work Experience</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {workHistory.map((job, index) => (
                      <div key={index} className="relative pl-6 pb-6 group">
                        {index !== workHistory.length - 1 && (
                          <div className="absolute top-0 left-[11px] bottom-0 w-[2px] bg-border group-hover:bg-primary/50 transition-colors" />
                        )}
                        <div className="absolute top-1 left-0 h-6 w-6 rounded-full border-2 border-primary bg-background flex items-center justify-center group-hover:bg-primary/10 transition-all">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-medium">{job.role}</h4>
                          <div className="flex items-center text-sm text-muted-foreground gap-2">
                            <Building size={14} />
                            <span>{job.company}</span>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground gap-2">
                            <Calendar size={14} />
                            <span>{job.period}</span>
                          </div>
                          <p className="text-sm mt-2">{job.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Plus size={14} />
                    <span>Add Experience</span>
                  </Button>
                </CardFooter>
              </Card>

              <Card className="transition-all duration-300 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award size={18} />
                    <span>Education</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {education.map((edu, index) => (
                      <div key={index} className="relative pl-6 pb-6 group">
                        {index !== education.length - 1 && (
                          <div className="absolute top-0 left-[11px] bottom-0 w-[2px] bg-border group-hover:bg-primary/50 transition-colors" />
                        )}
                        <div className="absolute top-1 left-0 h-6 w-6 rounded-full border-2 border-primary bg-background flex items-center justify-center group-hover:bg-primary/10 transition-all">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-medium">{edu.degree}</h4>
                          <div className="flex items-center text-sm text-muted-foreground gap-2">
                            <Building size={14} />
                            <span>{edu.institution}</span>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground gap-2">
                            <Calendar size={14} />
                            <span>{edu.year}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Plus size={14} />
                    <span>Add Education</span>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="activity" className="space-y-6 animate-in fade-in-50 duration-300">
              <Card className="transition-all duration-300 hover:shadow-md">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your activity across the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {activities.map((activity, index) => (
                      <div key={index} className="relative pl-6 pb-6 group">
                        {index !== activities.length - 1 && (
                          <div className="absolute top-0 left-[11px] bottom-0 w-[2px] bg-border group-hover:bg-primary/50 transition-colors" />
                        )}
                        <div className="absolute top-1 left-0 h-6 w-6 rounded-full border-2 border-primary bg-background flex items-center justify-center group-hover:bg-primary/10 transition-all">
                          <activity.icon size={14} className="text-primary" />
                        </div>
                        <div className="space-y-1">
                          <p>{activity.text}</p>
                          <p className="text-sm text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">View All Activity</Button>
                </CardFooter>
              </Card>

              <Card className="transition-all duration-300 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bookmark size={18} />
                    <span>Saved Items</span>
                  </CardTitle>
                  <CardDescription>Documents and resources you've bookmarked</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { title: "Q1 Department Strategy", type: "Document", saved: "2 days ago" },
                      { title: "New Product Launch Plan", type: "Spreadsheet", saved: "1 week ago" },
                      { title: "Team Performance Review", type: "Document", saved: "2 weeks ago" }
                    ].map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 rounded-lg border group hover:border-primary/50 transition-all">
                        <div className="flex items-center gap-3">
                          <FileText size={18} className="text-primary" />
                          <div>
                            <h4 className="font-medium group-hover:text-primary transition-colors">{item.title}</h4>
                            <p className="text-xs text-muted-foreground">{item.type} • Saved {item.saved}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ChevronRight size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-6 animate-in fade-in-50 duration-300">
              <Card className="transition-all duration-300 hover:shadow-md">
                <CardHeader>
                  <CardTitle>Profile Visibility</CardTitle>
                  <CardDescription>Control who can see your profile information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Make profile visible to everyone", description: "Anyone can view your profile information" },
                    { label: "Show work history", description: "Display your work experience on your profile" },
                    { label: "Show education history", description: "Display your educational background" },
                    { label: "Show activity feed", description: "Let others see your recent activities" }
                  ].map((setting, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{setting.label}</Label>
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                      </div>
                      <Switch defaultChecked={index < 3} className="transition-opacity hover:opacity-90" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="transition-all duration-300 hover:shadow-md">
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Manage notifications for profile-related activities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Profile views", description: "Get notified when someone views your profile" },
                    { label: "Endorsements", description: "Get notified when someone endorses your skills" },
                    { label: "Connection requests", description: "Get notified for new connection requests" }
                  ].map((setting, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{setting.label}</Label>
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                      </div>
                      <Switch defaultChecked className="transition-opacity hover:opacity-90" />
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Save Settings</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// Helper component for custom icon
const CheckIcon = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const Users = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export default Profile; 