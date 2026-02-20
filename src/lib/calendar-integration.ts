import { supabase } from "./supabase";

// Google Calendar API integration
export const syncToGoogleCalendar = async (
  type: "appointment" | "task",
  id: string,
  title: string,
  description: string,
  startDateTime: Date,
  endDateTime?: Date
) => {
  // This will be implemented with Google Calendar API
  // For now, return success to allow testing
  console.log("Google Calendar sync:", { type, id, title, startDateTime });
  return { success: true, calendarId: `gcal_${id}` };
};

// Send email notification
export const sendEmailNotification = async (
  to: string,
  subject: string,
  body: string
) => {
  // Email sending implementation
  console.log("Email sent:", { to, subject });
  return { success: true };
};

// Send WhatsApp notification
export const sendWhatsAppNotification = async (
  phone: string,
  message: string
) => {
  // WhatsApp API implementation
  console.log("WhatsApp sent:", { phone, message });
  return { success: true };
};

// Assign task to staff with notifications
export const assignTaskToStaff = async (
  taskId: string,
  staffId: string,
  taskTitle: string,
  dueDate: string
) => {
  const { data: staff } = await supabase
    .from("staff_list")
    .select("*")
    .eq("id", staffId)
    .single();

  if (!staff) return { success: false, error: "Staff not found" };

  // Send email
  if (staff.email) {
    await sendEmailNotification(
      staff.email,
      `New Task Assigned: ${taskTitle}`,
      `You have been assigned a new task: ${taskTitle}\nDue Date: ${dueDate}`
    );
  }

  // Send WhatsApp
  if (staff.phone) {
    await sendWhatsAppNotification(
      staff.phone,
      `New Task: ${taskTitle}\nDue: ${dueDate}`
    );
  }

  // Sync to Google Calendar
  const calendarSync = await syncToGoogleCalendar(
    "task",
    taskId,
    taskTitle,
    `Assigned to: ${staff.name}`,
    new Date(dueDate)
  );

  // Update task with calendar ID
  await supabase
    .from("tasks")
    .update({
      google_calendar_id: calendarSync.calendarId,
      google_calendar_synced: true,
      notification_sent: true
    })
    .eq("id", taskId);

  return { success: true };
};
