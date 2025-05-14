
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAttendance } from "@/context/AttendanceContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LogIn, LogOut, User, Clock, Calendar } from "lucide-react";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { todayRecord, recentRecords, checkIn, checkOut, isCheckedIn } = useAttendance();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useState(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const calculateDuration = (checkIn: Date, checkOut: Date | null) => {
    if (!checkOut) return "In progress";
    
    const diff = checkOut.getTime() - checkIn.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-primary mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Student Attendance</h1>
            </div>
            <div className="flex items-center">
              <span className="mr-4 text-gray-600">{user?.name}</span>
              <Button variant="outline" onClick={logout}>Logout</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current time */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Current Time</CardTitle>
              <CardDescription>Real-time clock</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <h2 className="text-3xl font-bold">{formatTime(currentTime)}</h2>
                <p className="text-gray-500 mt-2">{formatDate(currentTime)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Today's status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Today's Status</CardTitle>
              <CardDescription>Attendance for today</CardDescription>
            </CardHeader>
            <CardContent>
              {todayRecord ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Check In:</span>
                    <span className="font-medium">{formatTime(todayRecord.checkInTime)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Check Out:</span>
                    <span className="font-medium">
                      {todayRecord.checkOutTime 
                        ? formatTime(todayRecord.checkOutTime) 
                        : "Not checked out yet"}
                    </span>
                  </div>
                  {todayRecord.checkOutTime && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">
                        {calculateDuration(todayRecord.checkInTime, todayRecord.checkOutTime)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">No attendance recorded for today</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              {!todayRecord ? (
                <Button 
                  className="w-full" 
                  onClick={checkIn}
                >
                  <LogIn className="mr-2 h-4 w-4" /> Check In
                </Button>
              ) : !todayRecord.checkOutTime ? (
                <Button 
                  className="w-full" 
                  variant="secondary"
                  onClick={checkOut}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Check Out
                </Button>
              ) : (
                <Badge className="w-full justify-center py-2" variant="outline">
                  Completed for today
                </Badge>
              )}
            </CardFooter>
          </Card>

          {/* User info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">User Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center py-4">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4">
                  <User className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold">{user?.name}</h3>
                <p className="text-gray-500">{user?.email}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent attendance */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
            <CardDescription>Your attendance history</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRecords.length > 0 ? (
              <div className="space-y-4">
                {recentRecords.map((record) => (
                  <div key={record.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                        <span className="font-medium">{new Date(record.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}</span>
                      </div>
                      <Badge variant={record.checkOutTime ? "outline" : "secondary"}>
                        {record.checkOutTime ? "Completed" : "In Progress"}
                      </Badge>
                    </div>
                    <Separator className="my-2" />
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Check In</p>
                        <p className="font-medium">{formatTime(record.checkInTime)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Check Out</p>
                        <p className="font-medium">
                          {record.checkOutTime ? formatTime(record.checkOutTime) : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Duration</p>
                        <p className="font-medium">{calculateDuration(record.checkInTime, record.checkOutTime)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No attendance records found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
