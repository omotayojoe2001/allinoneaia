# Database Setup Instructions

## IMPORTANT: Run This SQL First!

Before using the Staff List and Task Assignment features, you MUST run the SQL schema in your Supabase database.

### Steps:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Run the SQL**
   - Open the file: `staff-tasks-calendar-schema.sql`
   - Copy ALL the SQL code
   - Paste it into the SQL Editor
   - Click "Run" button

4. **Verify Tables Created**
   - Go to "Table Editor" in left sidebar
   - You should see two new tables:
     - `staff_list`
     - `owner_profile`

5. **Verify Columns Added**
   - Check `tasks` table has new columns:
     - `assigned_to`
     - `assigned_to_self`
     - `notification_sent`
     - `google_calendar_id`
     - `google_calendar_synced`
   
   - Check `appointments` table has new columns:
     - `google_calendar_id`
     - `google_calendar_synced`

### After Running SQL:

1. Refresh your browser
2. Go to Staff Management
3. Record attendance for a staff member
4. Go to Staff List tab - you should see the staff member
5. Go to Tasks and create a new task
6. You should now see staff members in the "Assign To" dropdown

### Troubleshooting:

**If you still get 404 errors:**
- Make sure you ran the ENTIRE SQL file
- Check that RLS policies were created
- Verify tables exist in Table Editor
- Try logging out and back in

**If staff don't appear in Tasks:**
- Make sure you recorded attendance first (this adds them to staff_list)
- Or manually add staff to staff_list table
- Check that staff_list table has data

**If you see "Bad Request" errors:**
- The foreign key relationship needs the tables to exist first
- Run the SQL schema file completely
