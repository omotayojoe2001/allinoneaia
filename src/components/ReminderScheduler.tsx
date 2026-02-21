import { useEffect, useRef } from 'react';
import { processPendingReminders, processPendingCampaigns } from '@/lib/notification-service';

// Background job scheduler - runs every minute
export function useReminderScheduler() {
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Run immediately on mount
    processPendingReminders();
    processPendingCampaigns();

    // Then run every minute
    intervalRef.current = setInterval(() => {
      processPendingReminders();
      processPendingCampaigns();
    }, 60000); // 60 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}

// Standalone scheduler component
export function ReminderScheduler() {
  useReminderScheduler();
  return null;
}
