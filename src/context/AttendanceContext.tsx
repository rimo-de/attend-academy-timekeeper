
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from './AuthContext';
import { supabase } from "@/integrations/supabase/client";

interface AttendanceRecord {
  id: string;
  user_id: string;
  check_in_time: Date;
  check_out_time: Date | null;
  date: string;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface AttendanceContextType {
  todayRecord: AttendanceRecord | null;
  recentRecords: AttendanceRecord[];
  isLoading: boolean;
  checkIn: () => Promise<void>;
  checkOut: () => Promise<void>;
  isCheckedIn: boolean;
  fetchAttendanceByDateRange: (range: DateRange) => Promise<AttendanceRecord[]>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider = ({ children }: { children: ReactNode }) => {
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load attendance records when user changes
  useEffect(() => {
    if (user) {
      loadAttendanceRecords();
    } else {
      setTodayRecord(null);
      setRecentRecords([]);
    }
  }, [user]);

  const loadAttendanceRecords = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch today's record
      const { data: todayData, error: todayError } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      
      if (todayError) throw todayError;

      // Format the today record if it exists
      if (todayData) {
        const formattedTodayRecord = {
          ...todayData,
          check_in_time: new Date(todayData.check_in_time),
          check_out_time: todayData.check_out_time ? new Date(todayData.check_out_time) : null,
        };
        setTodayRecord(formattedTodayRecord);
      } else {
        setTodayRecord(null);
      }

      // Fetch recent records (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: recentData, error: recentError } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(10);
      
      if (recentError) throw recentError;

      // Format the recent records
      if (recentData) {
        const formattedRecentRecords = recentData.map(record => ({
          ...record,
          check_in_time: new Date(record.check_in_time),
          check_out_time: record.check_out_time ? new Date(record.check_out_time) : null,
        }));
        setRecentRecords(formattedRecentRecords);
      }
    } catch (error) {
      console.error('Failed to load attendance records', error);
      toast({
        variant: "destructive",
        title: "Error loading attendance",
        description: "Could not load your attendance records.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkIn = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Check if already checked in today
      if (todayRecord) {
        toast({
          variant: "default",
          title: "Already checked in",
          description: `You checked in at ${new Date(todayRecord.check_in_time).toLocaleTimeString()} today.`,
        });
        return;
      }
      
      // Create new attendance record
      const { data, error } = await supabase
        .from('attendance')
        .insert([
          {
            user_id: user.id,
            check_in_time: now.toISOString(),
            date: today,
          }
        ])
        .select()
        .single();
      
      if (error) throw error;

      // Format the new record
      const newRecord = {
        ...data,
        check_in_time: new Date(data.check_in_time),
        check_out_time: data.check_out_time ? new Date(data.check_out_time) : null,
      };
      
      // Update state
      setTodayRecord(newRecord);
      setRecentRecords([newRecord, ...recentRecords]);
      
      toast({
        title: "Checked in successfully",
        description: `You checked in at ${now.toLocaleTimeString()}.`,
      });
      
    } catch (error) {
      console.error('Check-in failed', error);
      toast({
        variant: "destructive",
        title: "Check-in failed",
        description: "Could not record your check-in.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkOut = async () => {
    if (!user || !todayRecord) return;
    
    try {
      setIsLoading(true);
      
      // If already checked out, show message and return
      if (todayRecord.check_out_time) {
        toast({
          variant: "default",
          title: "Already checked out",
          description: `You checked out at ${new Date(todayRecord.check_out_time).toLocaleTimeString()} today.`,
        });
        return;
      }
      
      const now = new Date();
      
      // Update today's record with check-out time
      const { data, error } = await supabase
        .from('attendance')
        .update({ check_out_time: now.toISOString() })
        .eq('id', todayRecord.id)
        .select()
        .single();
      
      if (error) throw error;

      // Format the updated record
      const updatedRecord = {
        ...data,
        check_in_time: new Date(data.check_in_time),
        check_out_time: new Date(data.check_out_time),
      };
      
      // Update state
      setTodayRecord(updatedRecord);
      setRecentRecords(recentRecords.map(record => 
        record.id === updatedRecord.id ? updatedRecord : record
      ));
      
      toast({
        title: "Checked out successfully",
        description: `You checked out at ${now.toLocaleTimeString()}.`,
      });
      
    } catch (error) {
      console.error('Check-out failed', error);
      toast({
        variant: "destructive",
        title: "Check-out failed",
        description: "Could not record your check-out.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendanceByDateRange = async (range: DateRange): Promise<AttendanceRecord[]> => {
    if (!user || !range.from || !range.to) return [];
    
    try {
      setIsLoading(true);
      
      const fromDate = range.from.toISOString().split('T')[0];
      const toDate = range.to.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', fromDate)
        .lte('date', toDate)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      // Format the records
      if (data) {
        return data.map(record => ({
          ...record,
          check_in_time: new Date(record.check_in_time),
          check_out_time: record.check_out_time ? new Date(record.check_out_time) : null,
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Failed to fetch attendance by date range', error);
      toast({
        variant: "destructive",
        title: "Error loading attendance",
        description: "Could not load your attendance records for the selected date range.",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AttendanceContext.Provider 
      value={{ 
        todayRecord, 
        recentRecords, 
        isLoading,
        checkIn, 
        checkOut, 
        isCheckedIn: !!todayRecord && !todayRecord.check_out_time,
        fetchAttendanceByDateRange
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
