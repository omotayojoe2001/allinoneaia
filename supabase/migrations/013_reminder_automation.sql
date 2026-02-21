-- Auto-reminder creation triggers and background job setup

-- Function to create reminder from invoice
CREATE OR REPLACE FUNCTION create_invoice_reminder()
RETURNS TRIGGER AS $$
DECLARE
  settings RECORD;
  reminder_date TIMESTAMPTZ;
BEGIN
  -- Get user's reminder settings for invoice category
  SELECT * INTO settings FROM reminder_settings 
  WHERE user_id = NEW.user_id AND category = 'invoice' AND enabled = true;
  
  -- Only create if settings exist and enabled
  IF settings IS NOT NULL THEN
    -- Calculate reminder date (due date minus advance time)
    reminder_date := NEW.due_date - (settings.advance_minutes || ' minutes')::INTERVAL;
    
    -- Create reminder
    INSERT INTO reminders (
      user_id, category, title, description, due_date, priority,
      related_id, related_type, recipient_email, metadata
    ) VALUES (
      NEW.user_id,
      'invoice',
      'Invoice Payment Due: ' || NEW.invoice_number,
      'Invoice #' || NEW.invoice_number || ' for ' || NEW.customer_name || ' - Amount: $' || NEW.total_amount,
      reminder_date,
      CASE 
        WHEN NEW.total_amount > 10000 THEN 'urgent'
        WHEN NEW.total_amount > 5000 THEN 'high'
        ELSE 'medium'
      END,
      NEW.id,
      'invoice',
      NEW.customer_email,
      jsonb_build_object(
        'invoice_number', NEW.invoice_number,
        'amount', NEW.total_amount,
        'customer', NEW.customer_name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create reminder from appointment
CREATE OR REPLACE FUNCTION create_appointment_reminder()
RETURNS TRIGGER AS $$
DECLARE
  settings RECORD;
  reminder_date TIMESTAMPTZ;
BEGIN
  SELECT * INTO settings FROM reminder_settings 
  WHERE user_id = NEW.user_id AND category = 'appointment' AND enabled = true;
  
  IF settings IS NOT NULL THEN
    reminder_date := NEW.appointment_date - (settings.advance_minutes || ' minutes')::INTERVAL;
    
    INSERT INTO reminders (
      user_id, category, title, description, due_date, priority,
      related_id, related_type, recipient_email, recipient_phone, metadata
    ) VALUES (
      NEW.user_id,
      'appointment',
      'Appointment: ' || NEW.title,
      'Appointment with ' || NEW.client_name || ' at ' || TO_CHAR(NEW.appointment_date, 'HH24:MI'),
      reminder_date,
      CASE 
        WHEN NEW.appointment_date - NOW() < INTERVAL '24 hours' THEN 'urgent'
        WHEN NEW.appointment_date - NOW() < INTERVAL '3 days' THEN 'high'
        ELSE 'medium'
      END,
      NEW.id,
      'appointment',
      NEW.client_email,
      NEW.client_phone,
      jsonb_build_object(
        'client', NEW.client_name,
        'date', NEW.appointment_date,
        'location', NEW.location
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create reminder from stock alert
CREATE OR REPLACE FUNCTION create_stock_reminder()
RETURNS TRIGGER AS $$
DECLARE
  settings RECORD;
BEGIN
  -- Trigger when stock falls below reorder level
  IF NEW.quantity <= NEW.reorder_level AND OLD.quantity > NEW.reorder_level THEN
    SELECT * INTO settings FROM reminder_settings 
    WHERE user_id = NEW.user_id AND category = 'stock' AND enabled = true;
    
    IF settings IS NOT NULL THEN
      INSERT INTO reminders (
        user_id, category, title, description, due_date, priority,
        related_id, related_type, metadata
      ) VALUES (
        NEW.user_id,
        'stock',
        'Low Stock Alert: ' || NEW.product_name,
        'Product "' || NEW.product_name || '" is low. Current: ' || NEW.quantity || ', Reorder at: ' || NEW.reorder_level,
        NOW() + (settings.advance_minutes || ' minutes')::INTERVAL,
        CASE 
          WHEN NEW.quantity = 0 THEN 'urgent'
          WHEN NEW.quantity < NEW.reorder_level / 2 THEN 'high'
          ELSE 'medium'
        END,
        NEW.id,
        'stock',
        jsonb_build_object(
          'product', NEW.product_name,
          'current_quantity', NEW.quantity,
          'reorder_level', NEW.reorder_level,
          'sku', NEW.sku
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers (will activate when tables exist)
DO $$ 
BEGIN
  -- Invoice trigger
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    DROP TRIGGER IF EXISTS invoice_reminder_trigger ON invoices;
    CREATE TRIGGER invoice_reminder_trigger
      AFTER INSERT ON invoices
      FOR EACH ROW
      WHEN (NEW.status = 'pending' AND NEW.due_date IS NOT NULL)
      EXECUTE FUNCTION create_invoice_reminder();
  END IF;

  -- Appointment trigger
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments') THEN
    DROP TRIGGER IF EXISTS appointment_reminder_trigger ON appointments;
    CREATE TRIGGER appointment_reminder_trigger
      AFTER INSERT ON appointments
      FOR EACH ROW
      WHEN (NEW.status != 'cancelled')
      EXECUTE FUNCTION create_appointment_reminder();
  END IF;

  -- Stock trigger
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory') THEN
    DROP TRIGGER IF EXISTS stock_reminder_trigger ON inventory;
    CREATE TRIGGER stock_reminder_trigger
      AFTER UPDATE ON inventory
      FOR EACH ROW
      EXECUTE FUNCTION create_stock_reminder();
  END IF;
END $$;

-- Function to process pending reminders (called by scheduler)
CREATE OR REPLACE FUNCTION process_pending_reminders()
RETURNS TABLE (
  reminder_id UUID,
  user_id UUID,
  category TEXT,
  title TEXT,
  recipient_email TEXT,
  recipient_phone TEXT,
  notification_types TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.user_id,
    r.category,
    r.title,
    r.recipient_email,
    r.recipient_phone,
    ARRAY_AGG(
      CASE 
        WHEN rs.send_email THEN 'email'
        WHEN rs.send_whatsapp THEN 'whatsapp'
        WHEN rs.send_push THEN 'push'
      END
    ) FILTER (WHERE rs.send_email OR rs.send_whatsapp OR rs.send_push) as notification_types
  FROM reminders r
  JOIN reminder_settings rs ON r.user_id = rs.user_id AND r.category = rs.category
  WHERE r.status = 'pending'
    AND r.due_date <= NOW()
    AND rs.enabled = true
  GROUP BY r.id, r.user_id, r.category, r.title, r.recipient_email, r.recipient_phone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark reminder as sent
CREATE OR REPLACE FUNCTION mark_reminder_sent(reminder_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE reminders 
  SET status = 'sent', updated_at = NOW()
  WHERE id = reminder_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log notification
CREATE OR REPLACE FUNCTION log_notification(
  reminder_uuid UUID,
  notif_type TEXT,
  notif_status TEXT DEFAULT 'sent',
  error_msg TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO reminder_notifications (
    reminder_id, notification_type, status, error_message
  ) VALUES (
    reminder_uuid, notif_type, notif_status, error_msg
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
