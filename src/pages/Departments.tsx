import React, { useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { useDepartments } from "@/components/DepartmentsProvider";
import { Users, Building, BarChart3, Briefcase, Plus, MoreHorizontal, Edit, Trash } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const Departments = () => {
  const { 
    departments, 
    teamMembers, 
    addDepartment, 
    updateDepartment, 
    deleteDepartment,
    addTeamMember,
    getDepartmentPerformanceData
  } = useDepartments();
  const { toast } = useToast();
  const [activeDepartment, setActiveDepartment] = useState("hr");
  const [isAddDepartmentOpen, setIsAddDepartmentOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<string | null>(null);
  const [departmentToDelete, setDepartmentToDelete] = useState<string | null>(null);
  
  // Form states
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
    budget: 0,
    location: '',
    managers: [] as string[],
    projects: 0,
    tasks: 0,
    employees: 0,
    progress: 0,
    teamMembers: [],
  });
  
  const [newTeamMember, setNewTeamMember] = useState({
    name: '',
    role: '',
    avatar: '',
    department: activeDepartment,
    status: 'active' as 'active' | 'vacation' | 'leave' | 'inactive',
  });

  // Find the current department
  const currentDepartment = departments.find(dept => dept.id === activeDepartment);
  const departmentPerformanceData = getDepartmentPerformanceData();
  
  // Calculate totals
  const totalEmployees = departments.reduce((sum, dept) => sum + dept.employees, 0);
  const totalProjects = departments.reduce((sum, dept) => sum + dept.projects, 0);
  const departmentGrowth = departments.length > 0 ? Math.round((departments.reduce((sum, dept) => sum + dept.progress, 0) / departments.length)) : 0;

  // Handle form submissions
  const handleAddDepartment = () => {
    addDepartment({
      ...newDepartment,
      teamMembers: []
    });
    setNewDepartment({
      name: '',
      description: '',
      budget: 0,
      location: '',
      managers: [],
      projects: 0,
      tasks: 0,
      employees: 0,
      progress: 0,
      teamMembers: [],
    });
    setIsAddDepartmentOpen(false);
  };

  const handleUpdateDepartment = () => {
    if (!editingDepartment) return;
    
    updateDepartment(editingDepartment, newDepartment);
    setEditingDepartment(null);
    setNewDepartment({
      name: '',
      description: '',
      budget: 0,
      location: '',
      managers: [],
      projects: 0,
      tasks: 0,
      employees: 0,
      progress: 0,
      teamMembers: [],
    });
  };

  const handleDeleteDepartment = () => {
    if (!departmentToDelete) return;
    
    deleteDepartment(departmentToDelete);
    setDepartmentToDelete(null);
    
    if (activeDepartment === departmentToDelete && departments.length > 0) {
      setActiveDepartment(departments[0].id);
    }
  };

  const handleAddTeamMember = () => {
    addTeamMember({
      ...newTeamMember,
      department: activeDepartment
    });
    setNewTeamMember({
      name: '',
      role: '',
      avatar: '',
      department: activeDepartment,
      status: 'active' as 'active' | 'vacation' | 'leave' | 'inactive',
    });
    setIsAddMemberOpen(false);
  };

  const startEditingDepartment = (dept) => {
    setEditingDepartment(dept.id);
    setNewDepartment({
      name: dept.name,
      description: dept.description,
      budget: dept.budget || 0,
      location: dept.location || '',
      managers: dept.managers || [],
      projects: dept.projects,
      tasks: dept.tasks,
      employees: dept.employees,
      progress: dept.progress,
      teamMembers: [],
    });
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'vacation': return 'bg-amber-500';
      case 'leave': return 'bg-orange-500';
      case 'inactive': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Department Overview</h1>
          <p className="text-muted-foreground mt-1">
            Manage and analyze department performance and resources.
          </p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setIsAddDepartmentOpen(true)}>
          <Plus size={16} />
          New Department
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <StatCard
          title="Total Departments"
          value={String(departments.length)}
          icon={Building}
          className="animate-fade-in [animation-delay:100ms]"
        />
        <StatCard
          title="Total Employees"
          value={String(totalEmployees)}
          icon={Users}
          trend="up"
          trendValue="12% from last month"
          className="animate-fade-in [animation-delay:200ms]"
        />
        <StatCard
          title="Active Projects"
          value={String(totalProjects)}
          icon={Briefcase}
          trend="up"
          trendValue="5% from last month"
          className="animate-fade-in [animation-delay:300ms]"
        />
        <StatCard
          title="Department Growth"
          value={`${departmentGrowth}%`}
          icon={BarChart3}
          trend="up"
          trendValue="3% from last year"
          className="animate-fade-in [animation-delay:400ms]"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 animate-fade-in [animation-delay:500ms]">
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
            <CardDescription>
              Compare performance metrics across departments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartCard
              title=""
              type="line"
              data={departmentPerformanceData}
              dataKey="value"
              categories={departments.map(d => d.name)}
              className="h-[350px]"
            />
          </CardContent>
        </Card>

        <Card className="animate-fade-in [animation-delay:600ms]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Departments</CardTitle>
              <CardDescription>
                Select a department to view details
              </CardDescription>
            </div>
            {currentDepartment && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => startEditingDepartment(currentDepartment)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Department
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setDepartmentToDelete(currentDepartment.id)}
                    className="text-red-600"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete Department
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue={activeDepartment} 
              onValueChange={setActiveDepartment}
              className="w-full"
            >
              <TabsList className="grid grid-cols-5">
                {departments.map((dept) => (
                  <TabsTrigger key={dept.id} value={dept.id}>
                    {dept.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {departments.map((dept) => (
                <TabsContent key={dept.id} value={dept.id} className="space-y-4 mt-4">
                  <div>
                    <h3 className="text-lg font-medium">{dept.name} Department</h3>
                    <p className="text-sm text-muted-foreground mt-1">{dept.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-muted/30 p-3 rounded-md text-center">
                      <p className="text-sm text-muted-foreground">Employees</p>
                      <p className="text-xl font-bold">{dept.employees}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-md text-center">
                      <p className="text-sm text-muted-foreground">Projects</p>
                      <p className="text-xl font-bold">{dept.projects}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-md text-center">
                      <p className="text-sm text-muted-foreground">Tasks</p>
                      <p className="text-xl font-bold">{dept.tasks}</p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium">Project Progress</p>
                      <p className="text-sm font-medium">{dept.progress}%</p>
                    </div>
                    <Progress value={dept.progress} className="h-2 mt-1" />
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Management</p>
                    <div className="flex gap-2 flex-wrap">
                      {dept.managers.map((manager, idx) => (
                        <Badge key={idx} variant="outline">{manager}</Badge>
                      ))}
                    </div>
                  </div>

                  {dept.budget && (
                    <div className="flex justify-between">
                      <p className="text-sm font-medium">Budget</p>
                      <p className="text-sm font-medium">${dept.budget.toLocaleString()}</p>
                    </div>
                  )}
                  
                  {dept.location && (
                    <div className="flex justify-between">
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm font-medium">{dept.location}</p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Card className="animate-fade-in [animation-delay:700ms]">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Employees from the {currentDepartment?.name} department
            </CardDescription>
          </div>
          <Button size="sm" className="flex items-center gap-2" onClick={() => setIsAddMemberOpen(true)}>
            <Plus size={14} />
            Add Member
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentDepartment?.teamMembers.map((member) => (
              <Card key={member.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center p-4">
                    <div className="relative mr-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{member.avatar}</AvatarFallback>
                      </Avatar>
                      <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(member.status)}`} />
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <div className="border-t px-4 py-2 flex justify-between items-center bg-muted/20">
                    <Badge 
                      variant="secondary" 
                      className="capitalize"
                    >
                      {member.status}
                    </Badge>
                    <Badge variant="outline">{currentDepartment.name}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Department Dialog */}
      <Dialog open={isAddDepartmentOpen} onOpenChange={setIsAddDepartmentOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add New Department</DialogTitle>
            <DialogDescription>
              Create a new department and set its basic properties.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="name">
                Department Name
              </label>
              <Input
                id="name"
                placeholder="e.g., Research & Development"
                value={newDepartment.name}
                onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="description">
                Description
              </label>
              <Textarea
                id="description"
                placeholder="Describe the department's purpose and responsibilities"
                value={newDepartment.description}
                onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="budget">
                  Budget ($)
                </label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="e.g., 250000"
                  value={newDepartment.budget || ''}
                  onChange={(e) => setNewDepartment({ ...newDepartment, budget: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="location">
                  Location
                </label>
                <Input
                  id="location"
                  placeholder="e.g., Floor 3, West Wing"
                  value={newDepartment.location}
                  onChange={(e) => setNewDepartment({ ...newDepartment, location: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="projects">
                  Projects
                </label>
                <Input
                  id="projects"
                  type="number"
                  placeholder="0"
                  value={newDepartment.projects || ''}
                  onChange={(e) => setNewDepartment({ ...newDepartment, projects: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="tasks">
                  Tasks
                </label>
                <Input
                  id="tasks"
                  type="number"
                  placeholder="0"
                  value={newDepartment.tasks || ''}
                  onChange={(e) => setNewDepartment({ ...newDepartment, tasks: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="progress">
                  Progress (%)
                </label>
                <Input
                  id="progress"
                  type="number"
                  placeholder="0"
                  min="0"
                  max="100"
                  value={newDepartment.progress || ''}
                  onChange={(e) => setNewDepartment({ ...newDepartment, progress: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDepartmentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDepartment}>Add Department</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={!!editingDepartment} onOpenChange={(open) => !open && setEditingDepartment(null)}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update the department's information and properties.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="edit-name">
                Department Name
              </label>
              <Input
                id="edit-name"
                value={newDepartment.name}
                onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="edit-description">
                Description
              </label>
              <Textarea
                id="edit-description"
                value={newDepartment.description}
                onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="edit-budget">
                  Budget ($)
                </label>
                <Input
                  id="edit-budget"
                  type="number"
                  value={newDepartment.budget || ''}
                  onChange={(e) => setNewDepartment({ ...newDepartment, budget: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="edit-location">
                  Location
                </label>
                <Input
                  id="edit-location"
                  value={newDepartment.location}
                  onChange={(e) => setNewDepartment({ ...newDepartment, location: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="edit-projects">
                  Projects
                </label>
                <Input
                  id="edit-projects"
                  type="number"
                  value={newDepartment.projects || ''}
                  onChange={(e) => setNewDepartment({ ...newDepartment, projects: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="edit-tasks">
                  Tasks
                </label>
                <Input
                  id="edit-tasks"
                  type="number"
                  value={newDepartment.tasks || ''}
                  onChange={(e) => setNewDepartment({ ...newDepartment, tasks: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="edit-progress">
                  Progress (%)
                </label>
                <Input
                  id="edit-progress"
                  type="number"
                  min="0"
                  max="100"
                  value={newDepartment.progress || ''}
                  onChange={(e) => setNewDepartment({ ...newDepartment, progress: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDepartment(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDepartment}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Team Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new team member to the {currentDepartment?.name} department.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="member-name">
                Name
              </label>
              <Input
                id="member-name"
                placeholder="Full Name"
                value={newTeamMember.name}
                onChange={(e) => setNewTeamMember({ ...newTeamMember, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="member-role">
                Role
              </label>
              <Input
                id="member-role"
                placeholder="e.g., Software Engineer"
                value={newTeamMember.role}
                onChange={(e) => setNewTeamMember({ ...newTeamMember, role: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Avatar</label>
              <Input
                placeholder="Initials (e.g., JD)"
                value={newTeamMember.avatar}
                onChange={(e) => setNewTeamMember({ ...newTeamMember, avatar: e.target.value })}
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                defaultValue={newTeamMember.status}
                onValueChange={(value) => 
                  setNewTeamMember({ 
                    ...newTeamMember, 
                    status: value as 'active' | 'vacation' | 'leave' | 'inactive' 
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="leave">Leave</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTeamMember}>Add Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Department Dialog */}
      <Dialog open={!!departmentToDelete} onOpenChange={(open) => !open && setDepartmentToDelete(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this department? This action cannot be undone.
              All team members associated with this department will also be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDepartmentToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDepartment}>
              Delete Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Departments;
