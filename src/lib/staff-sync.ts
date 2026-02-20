import { supabase } from "./supabase";

// Sync staff from staff table to staff_list (removes duplicates by email)
export const syncStaffToList = async (userId: string) => {
  // Get all staff
  const { data: staff } = await supabase
    .from("staff")
    .select("*")
    .eq("user_id", userId);

  if (!staff || staff.length === 0) return;

  // Get existing staff_list
  const { data: existingList } = await supabase
    .from("staff_list")
    .select("*")
    .eq("user_id", userId);

  const existingEmails = new Set(existingList?.map(s => s.email?.toLowerCase()) || []);
  const existingNames = new Set(existingList?.map(s => s.name?.toLowerCase()) || []);

  // Add new staff to staff_list (avoid duplicates by email or name)
  for (const member of staff) {
    const email = member.email?.toLowerCase();
    const name = member.name?.toLowerCase();
    
    // Skip if email or name already exists
    if ((email && existingEmails.has(email)) || existingNames.has(name)) {
      continue;
    }

    await supabase.from("staff_list").insert({
      user_id: userId,
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: member.position || "Staff"
    });

    if (email) existingEmails.add(email);
    existingNames.add(name);
  }
};
