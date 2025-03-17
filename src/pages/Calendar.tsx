
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, addMonths, subMonths, getMonth, getYear, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO } from "date-fns";

// Example event data
const events = [
  { id: 1, title: "Team Meeting", date: "2023-09-15", time: "10:00 AM", department: "All Teams", type: "meeting" },
  { id: 2, title: "Project Deadline", date: "2023-09-20", time: "11:30 AM", department: "Development", type: "deadline" },
  { id: 3, title: "Client Presentation", date: "2023-09-18", time: "2:00 PM", department: "Sales", type: "presentation" },
  { id: 4, title: "Training Session", date: "2023-09-22", time: "9:00 AM", department: "HR", type: "training" },
  { id: 5, title: "Quarterly Review", date: "2023-09-28", time: "3:00 PM", department: "Management", type: "review" },
];

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  
  // Get events for selected date
  const selectedDateEvents = events.filter(event => 
    isSameDay(parseISO(event.date), selectedDate)
  );
  
  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(parseISO(event.date), day));
  };
  
  const eventTypeColors = {
    meeting: "bg-blue-100 text-blue-800 border-blue-300",
    deadline: "bg-red-100 text-red-800 border-red-300",
    presentation: "bg-purple-100 text-purple-800 border-purple-300",
    training: "bg-green-100 text-green-800 border-green-300",
    review: "bg-amber-100 text-amber-800 border-amber-300"
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            Schedule and manage events, meetings, and deadlines
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus size={16} />
          Add Event
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>
                {format(currentDate, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-start-${i}`} className="p-2 border border-transparent h-24"></div>
              ))}
              
              {daysInMonth.map((day, i) => {
                const dayEvents = getEventsForDay(day);
                return (
                  <div 
                    key={i} 
                    className={`p-2 border rounded-md h-24 cursor-pointer hover:border-primary transition-colors ${
                      isSameDay(day, selectedDate) ? 'border-primary bg-primary/5' : 'border-muted'
                    } ${isToday(day) ? 'font-bold' : ''}`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="text-right text-sm mb-1">{format(day, 'd')}</div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div 
                          key={event.id} 
                          className={`text-xs truncate rounded px-1.5 py-0.5 border ${eventTypeColors[event.type as keyof typeof eventTypeColors]}`}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {Array.from({ length: 6 - monthEnd.getDay() }).map((_, i) => (
                <div key={`empty-end-${i}`} className="p-2 border border-transparent h-24"></div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {format(selectedDate, 'MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No events scheduled for this day</p>
                <Button variant="outline" className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Event
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateEvents.map((event) => (
                  <div key={event.id} className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">{event.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${eventTypeColors[event.type as keyof typeof eventTypeColors]}`}>
                        {event.type}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <ClockIcon className="h-3.5 w-3.5 mr-1" />
                        {event.time}
                      </div>
                      <div>
                        {event.department}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Helper component for the Calendar page
const ClockIcon = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default Calendar;
