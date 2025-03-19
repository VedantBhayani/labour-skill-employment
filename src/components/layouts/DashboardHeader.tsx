import React from "react";
import { Bell, ChevronDown, Menu, Search, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";

interface DashboardHeaderProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
}

export function DashboardHeader({ sidebarCollapsed, setSidebarCollapsed }: DashboardHeaderProps) {
  return (
    <header className="h-14 border-b border-border bg-background z-20 sticky top-0 flex items-center justify-between px-4">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="mr-4"
        >
          {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
        </Button>
        <div className="font-bold text-lg flex items-center gap-2">
          <span className="text-primary">Integrated</span>
          <span>Dashboard</span>
        </div>
      </div>

      <div className="hidden md:flex items-center relative max-w-sm">
        <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className="pl-8 bg-muted/30 border-none w-[250px] focus-visible:ring-1"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 pr-1">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User size={16} />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline-block">Admin User</span>
              <ChevronDown size={16} className="text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
