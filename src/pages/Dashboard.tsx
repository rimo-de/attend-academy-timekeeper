
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { 
  BarChart, 
  LogOut, 
  UserCircle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Calendar,
  FileText
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useAttendance } from "@/context/AttendanceContext";
import { Separator } from "@/components/ui/separator";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { todayRecord, recentRecords, checkIn, checkOut, isCheckedIn, isLoading } = useAttendance();
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Format time from Date object
  const formatTime = (date: Date) => {
    return format(date, "h:mm a");
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Student Attendance Dashboard</h1>
            {user && <p className="text-muted-foreground">Welcome, {user.user_metadata?.name || user.email}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/reports")}>
              <FileText className="mr-2 h-4 w-4" />
              View Reports
            </Button>
            <Button variant="outline" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Today's Attendance
              </CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="grid w-full grid-cols-2 gap-4 text-center">
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-4">
                    <p className="text-muted-foreground text-sm">Check In</p>
                    <p className="mt-2 font-semibold text-xl">
                      {todayRecord ? formatTime(todayRecord.check_in_time) : "Not Yet"}
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-4">
                    <p className="text-muted-foreground text-sm">Check Out</p>
                    <p className="mt-2 font-semibold text-xl">
                      {todayRecord?.check_out_time 
                        ? formatTime(todayRecord.check_out_time) 
                        : "Not Yet"}
                    </p>
                  </div>
                </div>

                <div className="w-full flex gap-4">
                  <Button 
                    className="w-full"
                    onClick={checkIn}
                    disabled={!!todayRecord || isLoading}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Check In
                  </Button>
                  <Button 
                    className="w-full"
                    variant="outline"
                    onClick={checkOut}
                    disabled={!isCheckedIn || isLoading}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Check Out
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCircle className="mr-2 h-5 w-5" />
                Attendance Status
              </CardTitle>
              <CardDescription>Your current attendance overview</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className="font-medium flex items-center">
                      {isCheckedIn ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                          Checked In
                        </>
                      ) : todayRecord?.check_out_time ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-gray-500 mr-2"></span>
                          Checked Out
                        </>
                      ) : (
                        <>
                          <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                          Not Checked In
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">Last 7 Days</span>
                    <span className="font-medium">
                      {recentRecords.filter(r => 
                        new Date(r.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                      ).length} days
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            <Separator className="my-2" />
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => navigate("/reports")}>
                <BarChart className="mr-2 h-4 w-4" />
                View Detailed Reports
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Recent Attendance
            </CardTitle>
            <CardDescription>Your last 10 attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Check In</th>
                      <th className="text-left py-3 px-4">Check Out</th>
                      <th className="text-left py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRecords.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-4">{format(new Date(record.date), 'MMM dd, yyyy')}</td>
                        <td className="py-3 px-4">{formatTime(record.check_in_time)}</td>
                        <td className="py-3 px-4">
                          {record.check_out_time ? formatTime(record.check_out_time) : "Not checked out"}
                        </td>
                        <td className="py-3 px-4">
                          {record.check_out_time ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              Complete
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                              Incomplete
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No attendance records found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
