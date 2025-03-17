
import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  MapPin,
  MoreHorizontal,
  Tags,
  CheckCircle,
  AlertCircle,
  Filter,
  Search
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, addDays, startOfWeek, addWeeks, startOfMonth, addMonths, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Event types and colors
interface EventType {
  id: string;
  name: string;
  color: string;
}

const eventTypes: EventType[] = [
  { id: "meeting", name: "Meeting", color: "bg-blue-500" },
  { id: "task", name: "Task", color: "bg-green-500" },
  { id: "deadline", name: "Deadline", color: "bg-red-500" },
  { id: "personal", name: "Personal", color: "bg-purple-500" },
  { id: "team", name: "Team Event", color: "bg-yellow-500" },
];

// Calendar event data
interface Event {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  location?: string;
  description?: string;
  attendees?: { id: string; name: string; avatar: string }[];
}

const eventsData: Event[] = [
  {
    id: "event1",
    title: "Weekly Team Meeting",
    date: "2023-09-21",
    startTime: "10:00",
    endTime: "11:00",
    type: "meeting",
    location: "Conference Room A",
    description: "Review progress on quarterly goals and upcoming projects",
    attendees: [
      { id: "user1", name: "Sarah Johnson", avatar: "SJ" },
      { id: "user2", name: "Michael Lee", avatar: "ML" },
      { id: "user3", name: "Emma Davis", avatar: "ED" },
    ],
  },
  {
    id: "event2",
    title: "Project Deadline: Q3 Report",
    date: "2023-09-22",
    startTime: "17:00",
    endTime: "18:00",
    type: "deadline",
    description: "Submit final Q3 performance report",
  },
  {
    id: "event3",
    title: "Client Presentation",
    date: "2023-09-23",
    startTime: "14:00",
    endTime: "15:30",
    type: "meeting",
    location: "Virtual (Zoom)",
    description: "Present new product features to Enterprise client",
    attendees: [
      { id: "user4", name: "Alex Chen", avatar: "AC" },
      { id: "user5", name: "Jennifer Williams", avatar: "JW" },
    ],
  },
  {
    id: "event4",
    title: "Team Building Event",
    date: "2023-09-24",
    startTime: "15:00",
    endTime: "18:00",
    type: "team",
    location: "City Park",
    description: "Outdoor team building activities",
    attendees: [
      { id: "user1", name: "Sarah Johnson", avatar: "SJ" },
      { id: "user2", name: "Michael Lee", avatar: "ML" },
      { id: "user3", name: "Emma Davis", avatar: "ED" },
      { id: "user4", name: "Alex Chen", avatar: "AC" },
      { id: "user5", name: "Jennifer Williams", avatar: "JW" },
    ],
  },
  {
    id: "event5",
    title: "Product Launch Planning",
    date: "2023-09-25",
    startTime: "11:00",
    endTime: "12:30",
    type: "meeting",
    location: "Conference Room B",
    description: "Plan timeline and resources for upcoming product launch",
    attendees: [
      { id: "user3", name: "Emma Davis", avatar: "ED" },
      { id: "user4", name: "Alex Chen", avatar: "AC" },
      { id: "user5", name: "Jennifer Williams", avatar: "JW" },
    ],
  },
  {
    id: "event6",
    title: "Complete Training Module",
    date: "2023-09-26",
    startTime: "09:00",
    endTime: "10:00",
    type: "task",
    description: "Complete required compliance training module",
  },
  {
    id: "event7",
    title: "Department Budget Review",
    date: "2023-09-26",
    startTime: "13:00",
    endTime: "14:00",
    type: "meeting",
    location: "Finance Department",
    description: "Review Q4 budget allocations",
    attendees: [
      { id: "user1", name: "Sarah Johnson", avatar: "SJ" },
      { id: "user6", name: "Robert Taylor", avatar: "RT" },
    ],
  },
  {
    id: "event8",
    title: "Dentist Appointment",
    date: "2023-09-27",
    startTime: "15:00",
    endTime: "16:00",
    type: "personal",
    location: "City Dental Clinic",
    description: "Regular checkup",
  },
];

// Helper function to get color based on event type
const getEventTypeColor = (type: string): string => {
  const eventType = eventTypes.find(t => t.id === type);
  return eventType ? eventType.color : "bg-gray-500";
};

const CalendarPage = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Generate days of the week for header
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const day = addDays(startOfWeek(date), i);
    return {
      date: day,
      dayName: format(day, "EEE"),
      dayNumber: format(day, "d"),
    };
  });

  // Filter events based on search query
  const filteredEvents = eventsData.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Helper to navigate between periods
  const navigatePeriod = (direction: "next" | "prev") => {
    if (view === "day") {
      setDate(prev => (direction === "next" ? addDays(prev, 1) : addDays(prev, -1)));
    } else if (view === "week") {
      setDate(prev => (direction === "next" ? addWeeks(prev, 1) : addWeeks(prev, -1)));
    } else if (view === "month") {
      setDate(prev => (direction === "next" ? addMonths(prev, 1) : addMonths(prev, -1)));
    }
  };

  // Get current period label based on view
  const getPeriodLabel = () => {
    if (view === "day") {
      return format(date, "MMMM d, yyyy");
    } else if (view === "week") {
      const start = startOfWeek(date);
      const end = addDays(start, 6);
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    } else {
      return format(date, "MMMM yyyy");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground mt-1">
              Schedule and manage your events and appointments
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus size={16} />
            New Event
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigatePeriod("prev")}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigatePeriod("next")}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
                <h2 className="text-xl font-semibold min-w-[200px]">{getPeriodLabel()}</h2>
                <Button variant="outline" onClick={() => setDate(new Date())}>
                  Today
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-[200px]">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select
                  value={view}
                  onValueChange={value => setView(value as "day" | "week" | "month")}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="View" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-7">
              {view === "month" && (
                <div className="hidden md:flex md:col-span-7 p-4">
                  <div className="w-full">
                    <CalendarComponent
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => newDate && setDate(newDate)}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
              
              {view === "week" && (
                <>
                  {/* Week View Header */}
                  {weekDays.map((day, index) => (
                    <div 
                      key={index}
                      className={`border-b border-r p-2 text-center ${
                        format(day.date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                          ? "bg-primary/10 font-medium"
                          : ""
                      }`}
                    >
                      <div className="text-sm text-muted-foreground">{day.dayName}</div>
                      <div className="text-lg">{day.dayNumber}</div>
                    </div>
                  ))}
                  
                  {/* Week View Content */}
                  {weekDays.map((day, index) => {
                    const dayEvents = filteredEvents.filter(
                      event => event.date === format(day.date, "yyyy-MM-dd")
                    );
                    return (
                      <div key={index} className="h-[calc(100vh-22rem)] border-r overflow-auto">
                        <div className="p-2 space-y-2">
                          {dayEvents.map((event) => (
                            <button
                              key={event.id}
                              className={`w-full text-left p-2 rounded-md ${getEventTypeColor(event.type)} bg-opacity-15 hover:bg-opacity-25 transition-colors border-l-4 ${getEventTypeColor(event.type)}`}
                              onClick={() => setSelectedEvent(event)}
                            >
                              <div className="font-medium truncate">{event.title}</div>
                              <div className="text-xs flex items-center gap-1">
                                <Clock size={12} />
                                {event.startTime} - {event.endTime}
                              </div>
                              {event.location && (
                                <div className="text-xs flex items-center gap-1 mt-1">
                                  <MapPin size={12} />
                                  {event.location}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
              
              {view === "day" && (
                <div className="col-span-7 p-4">
                  <div className="text-center mb-4">
                    <div className="text-sm text-muted-foreground">{format(date, "EEEE")}</div>
                    <div className="text-2xl font-bold">{format(date, "d MMMM yyyy")}</div>
                  </div>
                  
                  <div className="space-y-4">
                    {filteredEvents
                      .filter(event => event.date === format(date, "yyyy-MM-dd"))
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((event) => (
                        <div
                          key={event.id}
                          className="flex border rounded-md p-4 hover:border-primary transition-colors cursor-pointer"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <div className={`w-1 rounded-full mr-4 ${getEventTypeColor(event.type)}`}></div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold">{event.title}</h3>
                                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock size={14} />
                                    {event.startTime} - {event.endTime}
                                  </div>
                                  {event.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPin size={14} />
                                      {event.location}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Badge className={`${getEventTypeColor(event.type)} bg-opacity-20 text-foreground`}>
                                {eventTypes.find(t => t.id === event.type)?.name}
                              </Badge>
                            </div>
                            
                            {event.description && (
                              <p className="mt-2 text-sm">{event.description}</p>
                            )}
                            
                            {event.attendees && event.attendees.length > 0 && (
                              <div className="mt-3">
                                <div className="text-sm text-muted-foreground mb-1">Attendees:</div>
                                <div className="flex items-center -space-x-2">
                                  {event.attendees.slice(0, 5).map((attendee, idx) => (
                                    <Avatar key={idx} className="h-8 w-8 border-2 border-background">
                                      <AvatarFallback>{attendee.avatar}</AvatarFallback>
                                    </Avatar>
                                  ))}
                                  {event.attendees.length > 5 && (
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                                      +{event.attendees.length - 5}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    
                    {filteredEvents.filter(event => event.date === format(date, "yyyy-MM-dd")).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <CalendarIcon size={40} className="mx-auto mb-2 opacity-50" />
                        <p>No events scheduled for this day</p>
                        <Button variant="outline" className="mt-2">
                          <Plus size={16} className="mr-1" />
                          Add Event
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Your schedule for the next 7 days</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                {filteredEvents
                  .filter(event => {
                    // Filter for events up to 7 days from now
                    const eventDate = parseISO(event.date);
                    const today = new Date();
                    const sevenDaysLater = addDays(today, 7);
                    return eventDate >= today && eventDate <= sevenDaysLater;
                  })
                  .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
                  .map((event) => (
                    <div 
                      key={event.id}
                      className="p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {format(parseISO(event.date), "MMM d")} • {event.startTime} - {event.endTime}
                          </div>
                          {event.location && (
                            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin size={12} />
                              {event.location}
                            </div>
                          )}
                        </div>
                        <Badge className={`${getEventTypeColor(event.type)} bg-opacity-20 text-foreground`}>
                          {eventTypes.find(t => t.id === event.type)?.name}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Event Types</CardTitle>
              <CardDescription>Filter and manage your event categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {eventTypes.map((type) => (
                  <div key={type.id} className="flex flex-col items-center">
                    <div className={`h-12 w-12 rounded-full ${type.color} bg-opacity-20 flex items-center justify-center mb-2`}>
                      <div className={`h-6 w-6 rounded-full ${type.color}`}></div>
                    </div>
                    <div className="text-sm font-medium text-center">{type.name}</div>
                    <div className="text-xs text-muted-foreground text-center">
                      {eventsData.filter(e => e.type === type.id).length} events
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Detail Modal - In a real app you'd use a proper modal component */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex justify-between">
                <div>
                  <Badge className={`${getEventTypeColor(selectedEvent.type)} bg-opacity-20 text-foreground mb-2`}>
                    {eventTypes.find(t => t.id === selectedEvent.type)?.name}
                  </Badge>
                  <CardTitle>{selectedEvent.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <CalendarIcon size={14} />
                    {format(parseISO(selectedEvent.date), "EEEE, MMMM d, yyyy")}
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setSelectedEvent(null)}
                >
                  <MoreHorizontal size={18} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-muted-foreground" />
                  <span>
                    {selectedEvent.startTime} - {selectedEvent.endTime}
                  </span>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-muted-foreground" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
              </div>

              {selectedEvent.description && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Description</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Attendees ({selectedEvent.attendees.length})</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedEvent.attendees.map((attendee, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{attendee.avatar}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{attendee.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
              <div className="space-x-2">
                <Button variant="outline" className="gap-1">
                  <CheckCircle size={14} />
                  RSVP
                </Button>
                <Button variant="default">Edit Event</Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CalendarPage;
