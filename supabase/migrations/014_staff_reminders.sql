-- Add Staff Salary and Attendance Reminder Automation

-- Function: Create reminder for staff salary payment
CREATE OR REPLACE FUNCTION create_staff_salary_reminder()
RETURNS TRIGGER AS $$
DECLARE
  v_staff_record RECORD;
  v_payment_date DATE;
BEGIN
  -- Get staff details
  SELECT * INTO v_staff_record FROM staff WHERE id = NEW.staff_id;
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Calculate next payment date (assuming monthly on day 25)
  v_payment_date := DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '24 days';
  IF v_payment_date < CURRENT_DATE THEN
    v_payment_date := v_payment_date + INTERVAL '1 month';
  END IF;

  -- Create reminder 2 days before payment date
  INSERT INTO reminders (
    user_id,
    category,
    title,
    description,
    due_date,
    priority,
    status,
    reference_type,
    reference_id
  ) VALUES (
    v_staff_record.user_id,
    'staff_salary',
    'Salary Payment Due: ' || v_staff_record.name,
    'Salary payment of ' || v_staff_record.salary || ' due for ' || v_staff_record.name || ' (' || v_staff_record.position || ')',
    v_payment_date - INTERVAL '2 days',
    'high',
    'pending',
    'staff',
    NEW.staff_id
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Create reminder for staff absence
CREATE OR REPLACE FUNCTION create_staff_attendance_reminder()
RETURNS TRIGGER AS $$
DECLARE
  v_staff_record RECORD;
BEGIN
  -- Only create reminder if status is 'absent'
  IF NEW.status != 'absent' THEN
    RETURN NEW;
  END IF;

  -- Get staff details
  SELECT * INTO v_staff_record FROM staff WHERE id = NEW.staff_id;
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Create immediate reminder for absence
  INSERT INTO reminders (
    user_id,
    category,
    title,
    description,
    due_date,
    priority,
    status,
    reference_type,
    reference_id
  ) VALUES (
    v_staff_record.user_id,
    'staff_attendance',
    'Staff Absent: ' || v_staff_record.name,
    v_staff_record.name || ' (' || v_staff_record.position || ') marked absent on ' || NEW.date::TEXT,
    CURRENT_TIMESTAMP,
    'medium',
    'pending',
    'attendance',
    NEW.id
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Create reminder for task due date
CREATE OR REPLACE FUNCTION create_task_reminder()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create reminder if task is pending and has due date
  IF NEW.status != 'pending' OR NEW.due_date IS NULL THEN
    RETURN NEW;
  END IF;

  -- Create reminder 1 day before task due date
  INSERT INTO reminders (
    user_id,
    category,
    title,
    description,
    due_date,
    priority,
    status,
    reference_type,
    reference_id
  ) VALUES (
    NEW.user_id,
    'task',
    'Task Due: ' || NEW.title,
    COALESCE(NEW.description, 'Task deadline approaching'),
    NEW.due_date - INTERVAL '1 day',
    CASE NEW.priority
      WHEN 'high' THEN 'high'
      WHEN 'medium' THEN 'medium'
      ELSE 'low'
    END,
    'pending',
    'task',
    NEW.id
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_staff_salary_reminder ON staff;
DROP TRIGGER IF EXISTS trigger_attendance_reminder ON attendance;
DROP TRIGGER IF EXISTS trigger_task_reminder ON tasks;

-- Create triggers only if tables exist
DO $$
BEGIN
  -- Staff salary reminder trigger
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff') THEN
    CREATE TRIGGER trigger_staff_salary_reminder
      AFTER INSERT OR UPDATE ON staff
      FOR EACH ROW
      EXECUTE FUNCTION create_staff_salary_reminder();
  END IF;

  -- Attendance reminder trigger
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attendance') THEN
    CREATE TRIGGER trigger_attendance_reminder
      AFTER INSERT OR UPDATE ON attendance
      FOR EACH ROW
      EXECUTE FUNCTION create_staff_attendance_reminder();
  END IF;

  -- Task reminder trigger
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    CREATE TRIGGER trigger_task_reminder
      AFTER INSERT OR UPDATE ON tasks
      FOR EACH ROW
      EXECUTE FUNCTION create_task_reminder();
  END IF;
END $$;

-- Add new reminder categories if not exists
INSERT INTO reminder_categories (name, description, icon)
VALUES 
  ('staff_salary', 'Staff salary payment reminders', 'dollar-sign'),
  ('staff_attendance', 'Staff attendance alerts', 'user-x')
ON CONFLICT (name) DO NOTHING;

-- Create default settings for new categories (only if users exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM reminder_settings LIMIT 1) THEN
    INSERT INTO reminder_settings (user_id, category, enabled, advance_minutes, send_email, send_whatsapp, send_push)
    SELECT DISTINCT user_id, 'staff_salary', true, 2880, true, false, true
    FROM reminder_settings
    ON CONFLICT (user_id, category) DO NOTHING;

    INSERT INTO reminder_settings (user_id, category, enabled, advance_minutes, send_email, send_whatsapp, send_push)
    SELECT DISTINCT user_id, 'staff_attendance', true, 0, true, false, true
    FROM reminder_settings
    ON CONFLICT (user_id, category) DO NOTHING;
  END IF;
END $$;
