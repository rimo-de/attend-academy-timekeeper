
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO, differenceInHours, differenceInMinutes } from "date-fns";
import { DateRange } from "react-day-picker";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/DateRangePicker";
import { useAuth } from "@/context/AuthContext";
import { useAttendance } from "@/context/AttendanceContext";
import { Separator } from "@/components/ui/separator";

interface AttendanceReport {
  id: string;
  date: string;
  checkInTime: string;
  checkOutTime: string | null;
  duration: string;
}

const Reports = () => {
  const { user, isAuthenticated } = useAuth();
  const { fetchAttendanceByDateRange, isLoading } = useAttendance();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<AttendanceReport[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),  // Default: last 30 days
    to: new Date()
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      generateReport();
    }
  }, [dateRange]);

  const generateReport = async () => {
    if (!dateRange.from || !dateRange.to) return;
    
    const records = await fetchAttendanceByDateRange(dateRange);
    
    const formattedReport = records.map(record => {
      // Calculate duration if checked out
      let duration = "In progress";
      if (record.check_out_time) {
        const hours = differenceInHours(record.check_out_time, record.check_in_time);
        const minutes = differenceInMinutes(record.check_out_time, record.check_in_time) % 60;
        duration = `${hours}h ${minutes}m`;
      }
      
      return {
        id: record.id,
        date: format(new Date(record.date), 'yyyy-MM-dd'),
        checkInTime: format(record.check_in_time, 'HH:mm:ss'),
        checkOutTime: record.check_out_time ? format(record.check_out_time, 'HH:mm:ss') : null,
        duration
      };
    });
    
    setReportData(formattedReport);
  };

  const downloadCSV = () => {
    if (reportData.length === 0) return;
    
    // Create CSV header
    const csvHeader = "Date,Check In Time,Check Out Time,Duration\n";
    
    // Create CSV rows
    const csvRows = reportData.map(record => {
      return `${record.date},${record.checkInTime},${record.checkOutTime || "Not checked out"},${record.duration}`;
    }).join("\n");
    
    // Combine header and rows
    const csvString = csvHeader + csvRows;
    
    // Create download link
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate summary statistics
  const totalDays = reportData.length;
  const totalHours = reportData.reduce((total, record) => {
    if (record.duration !== "In progress") {
      const hours = parseInt(record.duration.split('h')[0]);
      return total + hours;
    }
    return total;
  }, 0);
  const averageHoursPerDay = totalDays > 0 ? (totalHours / totalDays).toFixed(1) : 0;

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Attendance Reports</h1>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
            <CardDescription>
              Select a date range to generate your attendance report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <DateRangePicker 
                dateRange={dateRange} 
                onDateRangeChange={setDateRange}
              />
              
              <div className="flex justify-end">
                <Button 
                  onClick={downloadCSV} 
                  disabled={reportData.length === 0 || isLoading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {reportData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>
                From {format(dateRange.from!, 'MMM dd, yyyy')} to {format(dateRange.to!, 'MMM dd, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
                <div className="flex flex-col items-center justify-center p-4 bg-slate-100 rounded-md">
                  <span className="text-muted-foreground text-sm">Total Days</span>
                  <span className="text-3xl font-bold">{totalDays}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-slate-100 rounded-md">
                  <span className="text-muted-foreground text-sm">Total Hours</span>
                  <span className="text-3xl font-bold">{totalHours}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-slate-100 rounded-md">
                  <span className="text-muted-foreground text-sm">Avg Hours/Day</span>
                  <span className="text-3xl font-bold">{averageHoursPerDay}</span>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Check In</th>
                      <th className="text-left py-3 px-4">Check Out</th>
                      <th className="text-left py-3 px-4">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-4">{record.date}</td>
                        <td className="py-3 px-4">{record.checkInTime}</td>
                        <td className="py-3 px-4">{record.checkOutTime || "Not checked out"}</td>
                        <td className="py-3 px-4">{record.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Reports;
