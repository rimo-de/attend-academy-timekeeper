
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from './AuthContext';

interface AttendanceRecord {
  id: string;
  userId: string;
  checkInTime: Date;
  checkOutTime: Date | null;
  date: string;
}

interface AttendanceContextType {
  todayRecord: AttendanceRecord | null;
  recentRecords: AttendanceRecord[];
  checkIn: () => void;
  checkOut: () => void;
  isCheckedIn: boolean;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider = ({ children }: { children: ReactNode }) => {
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load attendance records from localStorage on mount and when user changes
  useEffect(() => {
    if (user) {
      loadAttendanceRecords();
    } else {
      setTodayRecord(null);
      setRecentRecords([]);
    }
  }, [user]);

  const loadAttendanceRecords = () => {
    if (!user) return;

    try {
      const storedRecords = localStorage.getItem(`attendance_${user.id}`);
      if (storedRecords) {
        const parsedRecords: AttendanceRecord[] = JSON.parse(storedRecords).map((record: any) => ({
          ...record,
          checkInTime: new Date(record.checkInTime),
          checkOutTime: record.checkOutTime ? new Date(record.checkOutTime) : null,
        }));

        // Find today's record
        const today = new Date().toLocaleDateString();
        const todayRec = parsedRecords.find(record => record.date === today);
        setTodayRecord(todayRec || null);

        // Set recent records sorted by date (newest first)
        setRecentRecords(parsedRecords.sort((a, b) => 
          new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
        ));
      }
    } catch (error) {
      console.error('Failed to load attendance records', error);
    }
  };

  const saveAttendanceRecords = (records: AttendanceRecord[]) => {
    if (!user) return;
    localStorage.setItem(`attendance_${user.id}`, JSON.stringify(records));
  };

  const checkIn = () => {
    if (!user) return;
    
    const now = new Date();
    const today = now.toLocaleDateString();
    
    // Check if already checked in today
    if (todayRecord) {
      toast({
        variant: "default",
        title: "Already checked in",
        description: `You checked in at ${todayRecord.checkInTime.toLocaleTimeString()} today.`,
      });
      return;
    }
    
    // Create new attendance record
    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      userId: user.id,
      checkInTime: now,
      checkOutTime: null,
      date: today,
    };
    
    // Update state and save
    setTodayRecord(newRecord);
    const updatedRecords = [newRecord, ...recentRecords];
    setRecentRecords(updatedRecords);
    saveAttendanceRecords(updatedRecords);
    
    toast({
      title: "Checked in successfully",
      description: `You checked in at ${now.toLocaleTimeString()}.`,
    });
  };

  const checkOut = () => {
    if (!user || !todayRecord) return;
    
    // If already checked out, show message and return
    if (todayRecord.checkOutTime) {
      toast({
        variant: "default",
        title: "Already checked out",
        description: `You checked out at ${todayRecord.checkOutTime.toLocaleTimeString()} today.`,
      });
      return;
    }
    
    const now = new Date();
    
    // Update today's record
    const updatedRecord = {
      ...todayRecord,
      checkOutTime: now,
    };
    
    // Update state and save
    setTodayRecord(updatedRecord);
    const updatedRecords = recentRecords.map(record => 
      record.id === updatedRecord.id ? updatedRecord : record
    );
    setRecentRecords(updatedRecords);
    saveAttendanceRecords(updatedRecords);
    
    toast({
      title: "Checked out successfully",
      description: `You checked out at ${now.toLocaleTimeString()}.`,
    });
  };

  return (
    <AttendanceContext.Provider 
      value={{ 
        todayRecord, 
        recentRecords, 
        checkIn, 
        checkOut, 
        isCheckedIn: !!todayRecord && !todayRecord.checkOutTime,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
