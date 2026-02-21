import { supabase } from '@/lib/supabase';

// Tool definitions for Groq function calling
export const tools = [
  {
    type: 'function',
    function: {
      name: 'get_cashbook_summary',
      description: 'Get summary of cashbook entries including total income, expenses, and balance',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description: 'Number of days to look back (default 30)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_cashbook_entry',
      description: 'Add a new entry to the cashbook (sale, expense, income)',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['income', 'expense'],
            description: 'Type of transaction',
          },
          amount: {
            type: 'number',
            description: 'Amount of money',
          },
          description: {
            type: 'string',
            description: 'Description of the transaction',
          },
          category: {
            type: 'string',
            description: 'Category (e.g., sales, rent, utilities)',
          },
        },
        required: ['type', 'amount', 'description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_invoices',
      description: 'Get list of invoices with optional filters',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['pending', 'paid', 'overdue'],
            description: 'Filter by invoice status',
          },
          limit: {
            type: 'number',
            description: 'Number of invoices to return (default 10)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_stock_levels',
      description: 'Get current stock levels, optionally filter by low stock',
      parameters: {
        type: 'object',
        properties: {
          low_stock_only: {
            type: 'boolean',
            description: 'Only show items below reorder level',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_appointments',
      description: 'Get upcoming appointments',
      parameters: {
        type: 'object',
        properties: {
          days_ahead: {
            type: 'number',
            description: 'Number of days to look ahead (default 7)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_reminder',
      description: 'Create a new reminder',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Reminder title',
          },
          description: {
            type: 'string',
            description: 'Reminder description',
          },
          due_date: {
            type: 'string',
            description: 'Due date in ISO format',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'urgent'],
            description: 'Priority level',
          },
        },
        required: ['title', 'due_date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_invoice',
      description: 'Create a new invoice for a customer',
      parameters: {
        type: 'object',
        properties: {
          customer_name: {
            type: 'string',
            description: 'Customer name',
          },
          items: {
            type: 'array',
            description: 'Invoice items',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                quantity: { type: 'number' },
                rate: { type: 'number' },
              },
            },
          },
          delivery_fee: {
            type: 'number',
            description: 'Delivery fee amount',
          },
          tax_rate: {
            type: 'number',
            description: 'Tax rate percentage',
          },
          due_date: {
            type: 'string',
            description: 'Due date in ISO format',
          },
        },
        required: ['customer_name', 'items'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_customers',
      description: 'Get list of customers with optional filters',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of customers to return',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_customer',
      description: 'Add a new customer',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          address: { type: 'string' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_tasks',
      description: 'Get tasks with optional status filter',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['pending', 'completed'],
            description: 'Filter by task status',
          },
          overdue: {
            type: 'boolean',
            description: 'Show only overdue tasks',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a new task',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          due_date: { type: 'string' },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
          },
        },
        required: ['title', 'due_date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_staff',
      description: 'Get list of staff members',
      parameters: {
        type: 'object',
        properties: {
          position: {
            type: 'string',
            description: 'Filter by position',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_appointment',
      description: 'Create a new appointment',
      parameters: {
        type: 'object',
        properties: {
          customer_name: { type: 'string' },
          title: { type: 'string' },
          date: { type: 'string' },
          location: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['title', 'date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_stock',
      description: 'Update stock quantity for a product',
      parameters: {
        type: 'object',
        properties: {
          product_name: { type: 'string' },
          quantity_change: {
            type: 'number',
            description: 'Positive to add, negative to subtract',
          },
        },
        required: ['product_name', 'quantity_change'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_expense_breakdown',
      description: 'Get expenses grouped by category',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description: 'Number of days to look back',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'mark_invoice_paid',
      description: 'Mark an invoice as paid',
      parameters: {
        type: 'object',
        properties: {
          invoice_number: { type: 'string' },
        },
        required: ['invoice_number'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'complete_task',
      description: 'Mark a task as completed',
      parameters: {
        type: 'object',
        properties: {
          task_title: { type: 'string' },
        },
        required: ['task_title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_revenue_comparison',
      description: 'Compare revenue between two time periods',
      parameters: {
        type: 'object',
        properties: {
          period1: {
            type: 'string',
            enum: ['today', 'week', 'month', 'year'],
          },
          period2: {
            type: 'string',
            enum: ['today', 'week', 'month', 'year'],
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_top_customers',
      description: 'Get top customers by revenue',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'string',
            description: 'Number of customers to return',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_overdue_invoices',
      description: 'Get all overdue invoices',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_profit_margin',
      description: 'Calculate profit margin for a period',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'string',
            description: 'Number of days to analyze',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_transactions',
      description: 'Search cashbook transactions by description or category',
      parameters: {
        type: 'object',
        properties: {
          search_term: {
            type: 'string',
            description: 'Term to search for',
          },
          type: {
            type: 'string',
            enum: ['income', 'expense', 'all'],
          },
        },
        required: ['search_term'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_stock_value',
      description: 'Calculate total inventory value',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_customer_invoices',
      description: 'Get all invoices for a specific customer',
      parameters: {
        type: 'object',
        properties: {
          customer_name: {
            type: 'string',
            description: 'Customer name to search',
          },
        },
        required: ['customer_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_daily_summary',
      description: 'Get summary of today\'s activities',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_appointment',
      description: 'Cancel an appointment',
      parameters: {
        type: 'object',
        properties: {
          appointment_title: {
            type: 'string',
            description: 'Title of appointment to cancel',
          },
        },
        required: ['appointment_title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_stock_item',
      description: 'Add a new product to inventory',
      parameters: {
        type: 'object',
        properties: {
          product_name: { type: 'string' },
          quantity: { type: 'string' },
          price: { type: 'string' },
          reorder_level: { type: 'string' },
          sku: { type: 'string' },
        },
        required: ['product_name', 'quantity', 'price'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_transaction',
      description: 'Delete a cashbook transaction',
      parameters: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'Description of transaction to delete',
          },
        },
        required: ['description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_customer',
      description: 'Update customer information',
      parameters: {
        type: 'object',
        properties: {
          customer_name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          address: { type: 'string' },
        },
        required: ['customer_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_monthly_trends',
      description: 'Get revenue and expense trends by month',
      parameters: {
        type: 'object',
        properties: {
          months: {
            type: 'string',
            description: 'Number of months to analyze',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_unpaid_invoices_total',
      description: 'Get total amount of all unpaid invoices',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reschedule_appointment',
      description: 'Reschedule an appointment to a new date',
      parameters: {
        type: 'object',
        properties: {
          appointment_title: { type: 'string' },
          new_date: { type: 'string' },
        },
        required: ['appointment_title', 'new_date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_best_selling_products',
      description: 'Get products with highest sales',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'string',
            description: 'Number of products to return',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_staff_by_position',
      description: 'Get staff members filtered by position',
      parameters: {
        type: 'object',
        properties: {
          position: {
            type: 'string',
            description: 'Position to filter by',
          },
        },
        required: ['position'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_expense_by_category',
      description: 'Get total expenses for a specific category',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          days: { type: 'string' },
        },
        required: ['category'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_invoice_due_date',
      description: 'Update the due date of an invoice',
      parameters: {
        type: 'object',
        properties: {
          invoice_number: { type: 'string' },
          new_due_date: { type: 'string' },
        },
        required: ['invoice_number', 'new_due_date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_average_transaction',
      description: 'Get average transaction amount for income or expenses',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['income', 'expense'],
          },
          days: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_cash_flow',
      description: 'Get detailed cash flow analysis',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['week', 'month', 'quarter', 'year'],
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_customer_count',
      description: 'Get total number of customers',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_pending_tasks_count',
      description: 'Get count of pending tasks',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_appointments_today',
      description: 'Get all appointments scheduled for today',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_stock_alerts',
      description: 'Get products that need reordering',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_tax_owed',
      description: 'Calculate estimated tax based on income',
      parameters: {
        type: 'object',
        properties: {
          tax_rate: {
            type: 'string',
            description: 'Tax rate percentage',
          },
          period: {
            type: 'string',
            enum: ['month', 'quarter', 'year'],
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_invoice_by_number',
      description: 'Get specific invoice details by invoice number',
      parameters: {
        type: 'object',
        properties: {
          invoice_number: { type: 'string' },
        },
        required: ['invoice_number'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_transactions',
      description: 'Get most recent cashbook transactions',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'string',
            description: 'Number of transactions',
          },
          type: {
            type: 'string',
            enum: ['income', 'expense', 'all'],
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_largest_expense',
      description: 'Get the largest expense in a period',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'string',
            description: 'Number of days to look back',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_customer_payment_history',
      description: 'Get payment history for a customer',
      parameters: {
        type: 'object',
        properties: {
          customer_name: { type: 'string' },
        },
        required: ['customer_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_income_by_category',
      description: 'Get total income for a specific category',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          days: { type: 'string' },
        },
        required: ['category'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_completed_tasks',
      description: 'Get all completed tasks',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'string',
            description: 'Number of days to look back',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_cancelled_appointments',
      description: 'Get all cancelled appointments',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_total_payroll',
      description: 'Calculate total monthly payroll for all staff',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_invoice_statistics',
      description: 'Get comprehensive invoice statistics',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_expense_income_ratio',
      description: 'Calculate expense to income ratio',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'string',
            description: 'Number of days to analyze',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_customers',
      description: 'Search customers by name, email, or phone',
      parameters: {
        type: 'object',
        properties: {
          search_term: {
            type: 'string',
            description: 'Term to search for',
          },
        },
        required: ['search_term'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_high_priority_tasks',
      description: 'Get all high priority pending tasks',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_weekly_summary',
      description: 'Get comprehensive summary for the week',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_reminder',
      description: 'Delete a reminder',
      parameters: {
        type: 'object',
        properties: {
          reminder_title: {
            type: 'string',
            description: 'Title of reminder to delete',
          },
        },
        required: ['reminder_title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_seo_content',
      description: 'Generate SEO-optimized marketing content using AI',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Topic or subject for the content',
          },
          content_type: {
            type: 'string',
            enum: ['email', 'whatsapp', 'social', 'blog'],
            description: 'Type of content to generate',
          },
          tone: {
            type: 'string',
            enum: ['professional', 'casual', 'urgent', 'friendly'],
            description: 'Tone of the content',
          },
          length: {
            type: 'string',
            enum: ['short', 'medium', 'long'],
            description: 'Length of content',
          },
        },
        required: ['topic'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_contact_lists',
      description: 'Get all email/WhatsApp contact lists',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_email_campaign',
      description: 'Create and schedule an email campaign',
      parameters: {
        type: 'object',
        properties: {
          list_name: {
            type: 'string',
            description: 'Name of the contact list',
          },
          subject: {
            type: 'string',
            description: 'Email subject line',
          },
          body: {
            type: 'string',
            description: 'Email body content',
          },
          timing: {
            type: 'string',
            description: 'When to send (immediate, tomorrow, specific datetime)',
          },
        },
        required: ['list_name', 'subject', 'body'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_whatsapp_campaign',
      description: 'Create and schedule a WhatsApp campaign',
      parameters: {
        type: 'object',
        properties: {
          list_name: {
            type: 'string',
            description: 'Name of the contact list',
          },
          message: {
            type: 'string',
            description: 'WhatsApp message content',
          },
          timing: {
            type: 'string',
            description: 'When to send (immediate, tomorrow, specific datetime)',
          },
        },
        required: ['list_name', 'message'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_contact_list',
      description: 'Create a new email/WhatsApp contact list',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the list',
          },
          description: {
            type: 'string',
            description: 'Description of the list',
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_contacts_to_list',
      description: 'Add contacts to an email/WhatsApp list',
      parameters: {
        type: 'object',
        properties: {
          list_name: {
            type: 'string',
            description: 'Name of the list',
          },
          contacts: {
            type: 'string',
            description: 'JSON string of contacts array with name, email, phone',
          },
        },
        required: ['list_name', 'contacts'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_sales_summary',
      description: 'Get sales summary and statistics',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'week', 'month', 'year'],
            description: 'Time period for summary',
          },
        },
      },
    },
  },
];

// Tool execution functions
export async function executeTool(toolName: string, args: any, userId: string) {
  switch (toolName) {
    case 'get_cashbook_summary':
      return await getCashbookSummary(userId, args.days || 30);
    
    case 'add_cashbook_entry':
      return await addCashbookEntry(userId, args);
    
    case 'get_invoices':
      return await getInvoices(userId, args.status, args.limit || 10);
    
    case 'get_stock_levels':
      return await getStockLevels(userId, args.low_stock_only);
    
    case 'get_appointments':
      return await getAppointments(userId, args.days_ahead || 7);
    
    case 'create_reminder':
      return await createReminder(userId, args);
    
    case 'create_invoice':
      return await createInvoice(userId, args);
    
    case 'get_customers':
      return await getCustomers(userId, parseInt(args.limit) || 50);
    
    case 'add_customer':
      return await addCustomer(userId, args);
    
    case 'get_tasks':
      return await getTasks(userId, args.status, args.overdue);
    
    case 'create_task':
      return await createTask(userId, args);
    
    case 'get_staff':
      return await getStaff(userId, args.position);
    
    case 'create_appointment':
      return await createAppointment(userId, args);
    
    case 'update_stock':
      return await updateStock(userId, args);
    
    case 'get_expense_breakdown':
      return await getExpenseBreakdown(userId, args.days || 30);
    
    case 'mark_invoice_paid':
      return await markInvoicePaid(userId, args.invoice_number);
    
    case 'complete_task':
      return await completeTask(userId, args.task_title);
    
    case 'get_revenue_comparison':
      return await getRevenueComparison(userId, args.period1, args.period2);
    
    case 'get_top_customers':
      return await getTopCustomers(userId, parseInt(args.limit) || 5);
    
    case 'get_overdue_invoices':
      return await getOverdueInvoices(userId);
    
    case 'get_profit_margin':
      return await getProfitMargin(userId, parseInt(args.days) || 30);
    
    case 'search_transactions':
      return await searchTransactions(userId, args.search_term, args.type);
    
    case 'get_stock_value':
      return await getStockValue(userId);
    
    case 'get_customer_invoices':
      return await getCustomerInvoices(userId, args.customer_name);
    
    case 'get_daily_summary':
      return await getDailySummary(userId);
    
    case 'cancel_appointment':
      return await cancelAppointment(userId, args.appointment_title);
    
    case 'add_stock_item':
      return await addStockItem(userId, args);
    
    case 'delete_transaction':
      return await deleteTransaction(userId, args.description);
    
    case 'update_customer':
      return await updateCustomer(userId, args);
    
    case 'get_monthly_trends':
      return await getMonthlyTrends(userId, parseInt(args.months) || 6);
    
    case 'get_unpaid_invoices_total':
      return await getUnpaidInvoicesTotal(userId);
    
    case 'reschedule_appointment':
      return await rescheduleAppointment(userId, args.appointment_title, args.new_date);
    
    case 'get_best_selling_products':
      return await getBestSellingProducts(userId, parseInt(args.limit) || 5);
    
    case 'get_staff_by_position':
      return await getStaffByPosition(userId, args.position);
    
    case 'get_expense_by_category':
      return await getExpenseByCategory(userId, args.category, parseInt(args.days) || 30);
    
    case 'update_invoice_due_date':
      return await updateInvoiceDueDate(userId, args.invoice_number, args.new_due_date);
    
    case 'get_average_transaction':
      return await getAverageTransaction(userId, args.type, parseInt(args.days) || 30);
    
    case 'get_cash_flow':
      return await getCashFlow(userId, args.period || 'month');
    
    case 'get_customer_count':
      return await getCustomerCount(userId);
    
    case 'get_pending_tasks_count':
      return await getPendingTasksCount(userId);
    
    case 'get_appointments_today':
      return await getAppointmentsToday(userId);
    
    case 'get_stock_alerts':
      return await getStockAlerts(userId);
    
    case 'calculate_tax_owed':
      return await calculateTaxOwed(userId, parseFloat(args.tax_rate) || 15, args.period || 'month');
    
    case 'get_invoice_by_number':
      return await getInvoiceByNumber(userId, args.invoice_number);
    
    case 'get_recent_transactions':
      return await getRecentTransactions(userId, parseInt(args.limit) || 10, args.type);
    
    case 'get_largest_expense':
      return await getLargestExpense(userId, parseInt(args.days) || 30);
    
    case 'get_customer_payment_history':
      return await getCustomerPaymentHistory(userId, args.customer_name);
    
    case 'get_income_by_category':
      return await getIncomeByCategory(userId, args.category, parseInt(args.days) || 30);
    
    case 'get_completed_tasks':
      return await getCompletedTasks(userId, parseInt(args.days) || 30);
    
    case 'get_cancelled_appointments':
      return await getCancelledAppointments(userId);
    
    case 'get_total_payroll':
      return await getTotalPayroll(userId);
    
    case 'get_invoice_statistics':
      return await getInvoiceStatistics(userId);
    
    case 'get_expense_income_ratio':
      return await getExpenseIncomeRatio(userId, parseInt(args.days) || 30);
    
    case 'search_customers':
      return await searchCustomers(userId, args.search_term);
    
    case 'get_high_priority_tasks':
      return await getHighPriorityTasks(userId);
    
    case 'get_weekly_summary':
      return await getWeeklySummary(userId);
    
    case 'delete_reminder':
      return await deleteReminder(userId, args.reminder_title);
    
    case 'generate_seo_content':
      return await generateSEOContent(args);
    
    case 'get_contact_lists':
      return await getContactLists(userId);
    
    case 'create_email_campaign':
      return await createEmailCampaign(userId, args);
    
    case 'create_whatsapp_campaign':
      return await createWhatsAppCampaign(userId, args);
    
    case 'create_contact_list':
      return await createContactList(userId, args);
    
    case 'add_contacts_to_list':
      return await addContactsToList(userId, args);
    
    case 'get_sales_summary':
      return await getSalesSummary(userId, args.period || 'month');
    
    default:
      return { error: 'Unknown tool' };
  }
}

// Implementation functions
async function getCashbookSummary(userId: string, days: number) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('cashbook_transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString());

    if (error) {
      console.error('Cashbook query error:', error);
      return { error: error.message, no_data: true };
    }

    if (!data || data.length === 0) {
      return { 
        message: 'No cashbook entries found. Your cashbook is empty.',
        period_days: days,
        total_income: 0,
        total_expenses: 0,
        balance: 0,
        entry_count: 0,
      };
    }

    const income = data.filter(e => e.type === 'income').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const expenses = data.filter(e => e.type === 'expense').reduce((sum, e) => sum + parseFloat(e.amount), 0);

    return {
      period_days: days,
      total_income: income,
      total_expenses: expenses,
      balance: income - expenses,
      entry_count: data.length,
    };
  } catch (err: any) {
    console.error('getCashbookSummary error:', err);
    return { error: err.message, no_data: true };
  }
}

async function addCashbookEntry(userId: string, entry: any) {
  const { data, error } = await supabase
    .from('cashbook_transactions')
    .insert({
      user_id: userId,
      type: entry.type,
      amount: entry.amount,
      description: entry.description,
      category: entry.category || 'general',
      date: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { success: true, entry: data };
}

async function getInvoices(userId: string, status?: string, limit: number = 10) {
  let query = supabase
    .from('invoices')
    .select('invoice_number, amount, due_date, payment_status, customers(name, email)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('payment_status', status === 'pending' ? 'unpaid' : status);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };
  
  if (!data || data.length === 0) {
    return { message: 'No invoices found', invoices: [] };
  }
  
  return { invoices: data };
}

async function getStockLevels(userId: string, lowStockOnly?: boolean) {
  let query = supabase
    .from('stock')
    .select('product_name, quantity, reorder_level, sku, price')
    .eq('user_id', userId);

  const { data, error } = await query;
  if (error) return { error: error.message };
  
  if (lowStockOnly) {
    const lowStock = data?.filter(item => item.quantity <= item.reorder_level);
    return { items: lowStock, low_stock_count: lowStock?.length || 0 };
  }

  return { items: data };
}

async function getAppointments(userId: string, daysAhead: number) {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + daysAhead);

  const { data, error } = await supabase
    .from('appointments')
    .select('title, date, status, location, customers(name)')
    .eq('user_id', userId)
    .gte('date', new Date().toISOString())
    .lte('date', endDate.toISOString())
    .order('date', { ascending: true });

  if (error) return { error: error.message };
  
  if (!data || data.length === 0) {
    return { message: 'No upcoming appointments', appointments: [] };
  }
  
  return { appointments: data };
}

async function createReminder(userId: string, reminder: any) {
  const { data, error } = await supabase
    .from('reminders')
    .insert({
      user_id: userId,
      category: 'custom',
      title: reminder.title,
      description: reminder.description,
      due_date: reminder.due_date,
      priority: reminder.priority || 'medium',
      status: 'pending',
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { success: true, reminder: data };
}

async function createInvoice(userId: string, invoice: any) {
  try {
    console.log('[createInvoice] Starting with:', invoice);
    
    // Find or create customer
    let customerId = null;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', userId)
      .ilike('name', invoice.customer_name)
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.id;
      console.log('[createInvoice] Found existing customer:', customerId);
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({ user_id: userId, name: invoice.customer_name })
        .select('id')
        .single();
      
      if (customerError) {
        console.error('[createInvoice] Customer creation error:', customerError);
        return { error: customerError.message };
      }
      customerId = newCustomer.id;
      console.log('[createInvoice] Created new customer:', customerId);
    }

    // Calculate totals
    const subtotal = invoice.items.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.rate), 0);
    const taxAmount = subtotal * (invoice.tax_rate || 0) / 100;
    const deliveryFee = invoice.delivery_fee || 0;
    const total = subtotal + taxAmount + deliveryFee;

    console.log('[createInvoice] Calculated totals:', { subtotal, taxAmount, deliveryFee, total });

    // Create invoice
    const invoiceNumber = `INV-${Date.now()}`;
    const invoiceData = {
      user_id: userId,
      customer_id: customerId,
      invoice_number: invoiceNumber,
      currency: 'NGN',
      items: JSON.stringify(invoice.items),
      subtotal,
      tax: taxAmount,
      delivery_fee: deliveryFee,
      amount: total,
      due_date: invoice.due_date || null,
      status: 'due',
      payment_status: 'unpaid',
      notes: invoice.notes || '',
    };
    
    console.log('[createInvoice] Inserting invoice:', invoiceData);
    
    const { data, error } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single();

    if (error) {
      console.error('[createInvoice] Invoice creation error:', error);
      return { error: error.message };
    }
    
    console.log('[createInvoice] Invoice created successfully:', data);
    
    return {
      success: true,
      invoice_number: invoiceNumber,
      customer: invoice.customer_name,
      subtotal,
      tax: taxAmount,
      delivery_fee: deliveryFee,
      total,
      message: `Invoice ${invoiceNumber} created successfully for ${invoice.customer_name}. Total: NGN ${total.toFixed(2)}`,
    };
  } catch (err: any) {
    console.error('[createInvoice] Unexpected error:', err);
    return { error: err.message };
  }
}

async function getSalesSummary(userId: string, period: string) {
  let startDate = new Date();
  
  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  const { data, error } = await supabase
    .from('cashbook_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'income')
    .gte('date', startDate.toISOString());

  if (error) return { error: error.message };

  const totalSales = data?.reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;
  const salesCount = data?.length || 0;
  const avgSale = salesCount > 0 ? totalSales / salesCount : 0;

  return {
    period,
    total_sales: totalSales,
    sales_count: salesCount,
    average_sale: avgSale,
  };
}

async function getCustomers(userId: string, limit: number = 50) {
  const { data, error } = await supabase
    .from('customers')
    .select('name, email, phone, address')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(typeof limit === 'string' ? parseInt(limit) : limit);

  if (error) return { error: error.message };
  return { customers: data, count: data?.length || 0 };
}

async function addCustomer(userId: string, customer: any) {
  const { data, error } = await supabase
    .from('customers')
    .insert({
      user_id: userId,
      name: customer.name,
      email: customer.email || null,
      phone: customer.phone || null,
      address: customer.address || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { success: true, customer: data };
}

async function getTasks(userId: string, status?: string, overdue?: boolean) {
  let query = supabase
    .from('tasks')
    .select('title, description, due_date, status, priority')
    .eq('user_id', userId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('due_date', { ascending: true });
  if (error) return { error: error.message };

  let tasks = data || [];
  if (overdue) {
    tasks = tasks.filter(t => new Date(t.due_date) < new Date() && t.status === 'pending');
  }

  return { tasks, count: tasks.length };
}

async function createTask(userId: string, task: any) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title: task.title,
      description: task.description || '',
      due_date: task.due_date,
      priority: task.priority || 'medium',
      status: 'pending',
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { success: true, task: data };
}

async function getStaff(userId: string, position?: string) {
  let query = supabase
    .from('staff')
    .select('name, position, salary, phone, email')
    .eq('user_id', userId);

  if (position) {
    query = query.ilike('position', `%${position}%`);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };

  const totalPayroll = data?.reduce((sum, s) => sum + parseFloat(s.salary || 0), 0) || 0;
  return { staff: data, count: data?.length || 0, total_payroll: totalPayroll };
}

async function createAppointment(userId: string, appointment: any) {
  let customerId = null;
  
  if (appointment.customer_name) {
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', userId)
      .ilike('name', appointment.customer_name)
      .single();
    
    if (customer) customerId = customer.id;
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      user_id: userId,
      customer_id: customerId,
      title: appointment.title,
      date: appointment.date,
      location: appointment.location || '',
      notes: appointment.notes || '',
      status: 'scheduled',
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { success: true, appointment: data };
}

async function updateStock(userId: string, update: any) {
  const { data: product, error: fetchError } = await supabase
    .from('stock')
    .select('id, quantity')
    .eq('user_id', userId)
    .ilike('product_name', update.product_name)
    .single();

  if (fetchError) return { error: 'Product not found' };

  const newQuantity = product.quantity + update.quantity_change;

  const { error } = await supabase
    .from('stock')
    .update({ quantity: newQuantity })
    .eq('id', product.id);

  if (error) return { error: error.message };
  return { success: true, product_name: update.product_name, new_quantity: newQuantity };
}

async function getExpenseBreakdown(userId: string, days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('cashbook_transactions')
    .select('category, amount')
    .eq('user_id', userId)
    .eq('type', 'expense')
    .gte('date', startDate.toISOString());

  if (error) return { error: error.message };

  const breakdown: Record<string, number> = {};
  data?.forEach(e => {
    const cat = e.category || 'uncategorized';
    breakdown[cat] = (breakdown[cat] || 0) + parseFloat(e.amount);
  });

  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return { breakdown, total, period_days: days };
}

async function markInvoicePaid(userId: string, invoiceNumber: string) {
  const { error } = await supabase
    .from('invoices')
    .update({ payment_status: 'paid', status: 'paid' })
    .eq('user_id', userId)
    .eq('invoice_number', invoiceNumber);

  if (error) return { error: error.message };
  return { success: true, message: `Invoice ${invoiceNumber} marked as paid` };
}

async function completeTask(userId: string, taskTitle: string) {
  const { error } = await supabase
    .from('tasks')
    .update({ status: 'completed' })
    .eq('user_id', userId)
    .ilike('title', `%${taskTitle}%`);

  if (error) return { error: error.message };
  return { success: true, message: `Task "${taskTitle}" marked as completed` };
}

async function getRevenueComparison(userId: string, period1: string, period2: string) {
  const getRevenue = async (period: string) => {
    let startDate = new Date();
    switch (period) {
      case 'today': startDate.setHours(0, 0, 0, 0); break;
      case 'week': startDate.setDate(startDate.getDate() - 7); break;
      case 'month': startDate.setMonth(startDate.getMonth() - 1); break;
      case 'year': startDate.setFullYear(startDate.getFullYear() - 1); break;
    }
    const { data } = await supabase
      .from('cashbook_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'income')
      .gte('date', startDate.toISOString());
    return data?.reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;
  };

  const rev1 = await getRevenue(period1 || 'month');
  const rev2 = await getRevenue(period2 || 'week');
  const change = rev1 - rev2;
  const percentChange = rev2 > 0 ? ((change / rev2) * 100).toFixed(2) : 0;

  return {
    period1: period1 || 'month',
    revenue1: rev1,
    period2: period2 || 'week',
    revenue2: rev2,
    change,
    percent_change: percentChange,
  };
}

async function getTopCustomers(userId: string, limit: number) {
  const { data: invoices } = await supabase
    .from('invoices')
    .select('customer_id, amount, customers(name)')
    .eq('user_id', userId);

  const customerTotals: Record<string, { name: string; total: number }> = {};
  invoices?.forEach(inv => {
    const id = inv.customer_id;
    const name = inv.customers?.name || 'Unknown';
    if (!customerTotals[id]) customerTotals[id] = { name, total: 0 };
    customerTotals[id].total += parseFloat(inv.amount);
  });

  const sorted = Object.values(customerTotals)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

  return { top_customers: sorted };
}

async function getOverdueInvoices(userId: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number, amount, due_date, customers(name)')
    .eq('user_id', userId)
    .eq('payment_status', 'unpaid')
    .lt('due_date', new Date().toISOString());

  if (error) return { error: error.message };
  return { overdue_invoices: data, count: data?.length || 0 };
}

async function getProfitMargin(userId: string, days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data } = await supabase
    .from('cashbook_transactions')
    .select('type, amount')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString());

  const income = data?.filter(e => e.type === 'income').reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;
  const expenses = data?.filter(e => e.type === 'expense').reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;
  const profit = income - expenses;
  const margin = income > 0 ? ((profit / income) * 100).toFixed(2) : 0;

  return { income, expenses, profit, profit_margin_percent: margin, period_days: days };
}

async function searchTransactions(userId: string, searchTerm: string, type?: string) {
  let query = supabase
    .from('cashbook_transactions')
    .select('*')
    .eq('user_id', userId)
    .or(`description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);

  if (type && type !== 'all') {
    query = query.eq('type', type);
  }

  const { data, error } = await query.order('date', { ascending: false }).limit(20);
  if (error) return { error: error.message };
  return { transactions: data, count: data?.length || 0 };
}

async function getStockValue(userId: string) {
  const { data, error } = await supabase
    .from('stock')
    .select('product_name, quantity, price')
    .eq('user_id', userId);

  if (error) return { error: error.message };

  const totalValue = data?.reduce((sum, item) => sum + (item.quantity * parseFloat(item.price)), 0) || 0;
  const itemCount = data?.length || 0;

  return { total_inventory_value: totalValue, item_count: itemCount, items: data };
}

async function getCustomerInvoices(userId: string, customerName: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number, amount, due_date, payment_status, customers(name)')
    .eq('user_id', userId)
    .ilike('customers.name', `%${customerName}%`);

  if (error) return { error: error.message };

  const total = data?.reduce((sum, inv) => sum + parseFloat(inv.amount), 0) || 0;
  const unpaid = data?.filter(inv => inv.payment_status === 'unpaid').length || 0;

  return { customer: customerName, invoices: data, total_amount: total, unpaid_count: unpaid };
}

async function getDailySummary(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [transactions, appointments, tasks] = await Promise.all([
    supabase.from('cashbook_transactions').select('type, amount').eq('user_id', userId).gte('date', today.toISOString()),
    supabase.from('appointments').select('*').eq('user_id', userId).gte('date', today.toISOString()),
    supabase.from('tasks').select('*').eq('user_id', userId).eq('status', 'pending').lte('due_date', new Date().toISOString()),
  ]);

  const income = transactions.data?.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0) || 0;
  const expenses = transactions.data?.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0) || 0;

  return {
    date: today.toISOString().split('T')[0],
    income,
    expenses,
    net: income - expenses,
    appointments_count: appointments.data?.length || 0,
    pending_tasks: tasks.data?.length || 0,
  };
}

async function cancelAppointment(userId: string, title: string) {
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('user_id', userId)
    .ilike('title', `%${title}%`);

  if (error) return { error: error.message };
  return { success: true, message: `Appointment "${title}" cancelled` };
}

async function addStockItem(userId: string, item: any) {
  const { data, error } = await supabase
    .from('stock')
    .insert({
      user_id: userId,
      product_name: item.product_name,
      quantity: parseInt(item.quantity),
      price: parseFloat(item.price),
      reorder_level: parseInt(item.reorder_level) || 10,
      sku: item.sku || '',
      cost: parseFloat(item.cost) || 0,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { success: true, product: data };
}

async function deleteTransaction(userId: string, description: string) {
  const { error } = await supabase
    .from('cashbook_transactions')
    .delete()
    .eq('user_id', userId)
    .ilike('description', `%${description}%`);

  if (error) return { error: error.message };
  return { success: true, message: `Transaction deleted` };
}

async function updateCustomer(userId: string, updates: any) {
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', userId)
    .ilike('name', updates.customer_name)
    .single();

  if (!customer) return { error: 'Customer not found' };

  const updateData: any = {};
  if (updates.email) updateData.email = updates.email;
  if (updates.phone) updateData.phone = updates.phone;
  if (updates.address) updateData.address = updates.address;

  const { error } = await supabase
    .from('customers')
    .update(updateData)
    .eq('id', customer.id);

  if (error) return { error: error.message };
  return { success: true, message: `Customer ${updates.customer_name} updated` };
}

async function getMonthlyTrends(userId: string, months: number) {
  const trends = [];
  for (let i = 0; i < months; i++) {
    const start = new Date();
    start.setMonth(start.getMonth() - i);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const { data } = await supabase
      .from('cashbook_transactions')
      .select('type, amount')
      .eq('user_id', userId)
      .gte('date', start.toISOString())
      .lt('date', end.toISOString());

    const income = data?.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0) || 0;
    const expenses = data?.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0) || 0;

    trends.push({
      month: start.toLocaleString('default', { month: 'long', year: 'numeric' }),
      income,
      expenses,
      profit: income - expenses,
    });
  }

  return { trends: trends.reverse() };
}

async function getUnpaidInvoicesTotal(userId: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('amount')
    .eq('user_id', userId)
    .eq('payment_status', 'unpaid');

  if (error) return { error: error.message };

  const total = data?.reduce((sum, inv) => sum + parseFloat(inv.amount), 0) || 0;
  return { total_unpaid: total, invoice_count: data?.length || 0 };
}

async function rescheduleAppointment(userId: string, title: string, newDate: string) {
  const { error } = await supabase
    .from('appointments')
    .update({ date: newDate })
    .eq('user_id', userId)
    .ilike('title', `%${title}%`);

  if (error) return { error: error.message };
  return { success: true, message: `Appointment rescheduled to ${newDate}` };
}

async function getBestSellingProducts(userId: string, limit: number) {
  // This would need a sales tracking table, for now return stock sorted by quantity sold
  const { data } = await supabase
    .from('stock')
    .select('product_name, quantity, price')
    .eq('user_id', userId)
    .order('quantity', { ascending: false })
    .limit(limit);

  return { products: data };
}

async function getStaffByPosition(userId: string, position: string) {
  const { data, error } = await supabase
    .from('staff')
    .select('name, salary, phone, email')
    .eq('user_id', userId)
    .ilike('position', `%${position}%`);

  if (error) return { error: error.message };
  return { staff: data, count: data?.length || 0 };
}

async function getExpenseByCategory(userId: string, category: string, days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('cashbook_transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('type', 'expense')
    .ilike('category', `%${category}%`)
    .gte('date', startDate.toISOString());

  if (error) return { error: error.message };

  const total = data?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
  return { category, total, transaction_count: data?.length || 0, period_days: days };
}

async function updateInvoiceDueDate(userId: string, invoiceNumber: string, newDueDate: string) {
  const { error } = await supabase
    .from('invoices')
    .update({ due_date: newDueDate })
    .eq('user_id', userId)
    .eq('invoice_number', invoiceNumber);

  if (error) return { error: error.message };
  return { success: true, message: `Invoice ${invoiceNumber} due date updated to ${newDueDate}` };
}

async function getAverageTransaction(userId: string, type: string, days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('cashbook_transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('type', type)
    .gte('date', startDate.toISOString());

  if (error) return { error: error.message };

  const total = data?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
  const count = data?.length || 0;
  const average = count > 0 ? total / count : 0;

  return { type, average, total, count, period_days: days };
}

async function getCashFlow(userId: string, period: string) {
  let startDate = new Date();
  switch (period) {
    case 'week': startDate.setDate(startDate.getDate() - 7); break;
    case 'month': startDate.setMonth(startDate.getMonth() - 1); break;
    case 'quarter': startDate.setMonth(startDate.getMonth() - 3); break;
    case 'year': startDate.setFullYear(startDate.getFullYear() - 1); break;
  }

  const { data } = await supabase
    .from('cashbook_transactions')
    .select('type, amount, date, category')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString())
    .order('date', { ascending: true });

  const income = data?.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0) || 0;
  const expenses = data?.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0) || 0;
  const netCashFlow = income - expenses;

  return {
    period,
    total_inflow: income,
    total_outflow: expenses,
    net_cash_flow: netCashFlow,
    transaction_count: data?.length || 0,
  };
}

async function getCustomerCount(userId: string) {
  const { count, error } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) return { error: error.message };
  return { customer_count: count || 0 };
}

async function getPendingTasksCount(userId: string) {
  const { count, error } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'pending');

  if (error) return { error: error.message };
  return { pending_tasks: count || 0 };
}

async function getAppointmentsToday(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data, error } = await supabase
    .from('appointments')
    .select('title, date, location, status, customers(name)')
    .eq('user_id', userId)
    .gte('date', today.toISOString())
    .lt('date', tomorrow.toISOString())
    .order('date', { ascending: true });

  if (error) return { error: error.message };
  return { appointments: data, count: data?.length || 0 };
}

async function getStockAlerts(userId: string) {
  const { data, error } = await supabase
    .from('stock')
    .select('product_name, quantity, reorder_level, sku')
    .eq('user_id', userId);

  if (error) return { error: error.message };

  const alerts = data?.filter(item => item.quantity <= item.reorder_level) || [];
  return { alerts, alert_count: alerts.length };
}

async function calculateTaxOwed(userId: string, taxRate: number, period: string) {
  let startDate = new Date();
  switch (period) {
    case 'month': startDate.setMonth(startDate.getMonth() - 1); break;
    case 'quarter': startDate.setMonth(startDate.getMonth() - 3); break;
    case 'year': startDate.setFullYear(startDate.getFullYear() - 1); break;
  }

  const { data } = await supabase
    .from('cashbook_transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('type', 'income')
    .gte('date', startDate.toISOString());

  const totalIncome = data?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
  const taxOwed = totalIncome * (taxRate / 100);

  return {
    period,
    total_income: totalIncome,
    tax_rate: taxRate,
    estimated_tax: taxOwed,
  };
}

async function getInvoiceByNumber(userId: string, invoiceNumber: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, customers(name, email, phone, address)')
    .eq('user_id', userId)
    .eq('invoice_number', invoiceNumber)
    .single();

  if (error) return { error: 'Invoice not found' };
  return { invoice: data };
}

async function getRecentTransactions(userId: string, limit: number, type?: string) {
  let query = supabase
    .from('cashbook_transactions')
    .select('*')
    .eq('user_id', userId);

  if (type && type !== 'all') {
    query = query.eq('type', type);
  }

  const { data, error } = await query
    .order('date', { ascending: false })
    .limit(limit);

  if (error) return { error: error.message };
  return { transactions: data, count: data?.length || 0 };
}

async function getLargestExpense(userId: string, days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('cashbook_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'expense')
    .gte('date', startDate.toISOString())
    .order('amount', { ascending: false })
    .limit(1)
    .single();

  if (error) return { message: 'No expenses found' };
  return { largest_expense: data };
}

async function getCustomerPaymentHistory(userId: string, customerName: string) {
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', userId)
    .ilike('name', customerName)
    .single();

  if (!customer) return { error: 'Customer not found' };

  const { data: invoices } = await supabase
    .from('invoices')
    .select('invoice_number, amount, payment_status, due_date, created_at')
    .eq('user_id', userId)
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false });

  const totalPaid = invoices?.filter(i => i.payment_status === 'paid').reduce((s, i) => s + parseFloat(i.amount), 0) || 0;
  const totalUnpaid = invoices?.filter(i => i.payment_status === 'unpaid').reduce((s, i) => s + parseFloat(i.amount), 0) || 0;

  return {
    customer: customerName,
    invoices,
    total_paid: totalPaid,
    total_unpaid: totalUnpaid,
    invoice_count: invoices?.length || 0,
  };
}

async function getIncomeByCategory(userId: string, category: string, days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('cashbook_transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('type', 'income')
    .ilike('category', `%${category}%`)
    .gte('date', startDate.toISOString());

  if (error) return { error: error.message };

  const total = data?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
  return { category, total, transaction_count: data?.length || 0, period_days: days };
}

async function getCompletedTasks(userId: string, days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('tasks')
    .select('title, description, due_date')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('updated_at', startDate.toISOString());

  if (error) return { error: error.message };
  return { completed_tasks: data, count: data?.length || 0 };
}

async function getCancelledAppointments(userId: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select('title, date, location, customers(name)')
    .eq('user_id', userId)
    .eq('status', 'cancelled')
    .order('date', { ascending: false });

  if (error) return { error: error.message };
  return { cancelled_appointments: data, count: data?.length || 0 };
}

async function getTotalPayroll(userId: string) {
  const { data, error } = await supabase
    .from('staff')
    .select('name, salary, position')
    .eq('user_id', userId);

  if (error) return { error: error.message };

  const totalPayroll = data?.reduce((sum, s) => sum + parseFloat(s.salary || 0), 0) || 0;
  return {
    total_monthly_payroll: totalPayroll,
    staff_count: data?.length || 0,
    average_salary: data?.length ? totalPayroll / data.length : 0,
  };
}

async function getInvoiceStatistics(userId: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('amount, payment_status')
    .eq('user_id', userId);

  if (error) return { error: error.message };

  const total = data?.reduce((s, i) => s + parseFloat(i.amount), 0) || 0;
  const paid = data?.filter(i => i.payment_status === 'paid').reduce((s, i) => s + parseFloat(i.amount), 0) || 0;
  const unpaid = data?.filter(i => i.payment_status === 'unpaid').reduce((s, i) => s + parseFloat(i.amount), 0) || 0;
  const paidCount = data?.filter(i => i.payment_status === 'paid').length || 0;
  const unpaidCount = data?.filter(i => i.payment_status === 'unpaid').length || 0;

  return {
    total_invoices: data?.length || 0,
    total_amount: total,
    paid_amount: paid,
    unpaid_amount: unpaid,
    paid_count: paidCount,
    unpaid_count: unpaidCount,
    average_invoice: data?.length ? total / data.length : 0,
  };
}

async function getExpenseIncomeRatio(userId: string, days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data } = await supabase
    .from('cashbook_transactions')
    .select('type, amount')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString());

  const income = data?.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0) || 0;
  const expenses = data?.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0) || 0;
  const ratio = income > 0 ? (expenses / income * 100).toFixed(2) : 0;

  return {
    income,
    expenses,
    ratio_percent: ratio,
    period_days: days,
    message: `You spend ${ratio}% of what you earn`,
  };
}

async function searchCustomers(userId: string, searchTerm: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('name, email, phone, address')
    .eq('user_id', userId)
    .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);

  if (error) return { error: error.message };
  return { customers: data, count: data?.length || 0 };
}

async function getHighPriorityTasks(userId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('title, description, due_date, priority')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .eq('priority', 'high')
    .order('due_date', { ascending: true });

  if (error) return { error: error.message };
  return { high_priority_tasks: data, count: data?.length || 0 };
}

async function getWeeklySummary(userId: string) {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const [transactions, invoices, appointments, tasks] = await Promise.all([
    supabase.from('cashbook_transactions').select('type, amount').eq('user_id', userId).gte('date', weekStart.toISOString()),
    supabase.from('invoices').select('amount, payment_status').eq('user_id', userId).gte('created_at', weekStart.toISOString()),
    supabase.from('appointments').select('*').eq('user_id', userId).gte('date', weekStart.toISOString()),
    supabase.from('tasks').select('*').eq('user_id', userId).eq('status', 'completed').gte('updated_at', weekStart.toISOString()),
  ]);

  const income = transactions.data?.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0) || 0;
  const expenses = transactions.data?.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0) || 0;
  const invoicesCreated = invoices.data?.length || 0;
  const appointmentsCount = appointments.data?.length || 0;
  const tasksCompleted = tasks.data?.length || 0;

  return {
    period: 'Last 7 days',
    income,
    expenses,
    net: income - expenses,
    invoices_created: invoicesCreated,
    appointments: appointmentsCount,
    tasks_completed: tasksCompleted,
  };
}

async function deleteReminder(userId: string, title: string) {
  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('user_id', userId)
    .ilike('title', `%${title}%`);

  if (error) return { error: error.message };
  return { success: true, message: `Reminder "${title}" deleted` };
}

async function generateSEOContent(params: any) {
  const { topic, content_type = 'email', tone = 'professional', length = 'medium' } = params;
  
  const lengthGuide = {
    short: '50-100 words',
    medium: '150-250 words',
    long: '300-500 words',
  };

  const prompt = `Create ${tone} ${content_type} content about: ${topic}\n\nLength: ${lengthGuide[length as keyof typeof lengthGuide]}\n\nRequirements:\n- SEO optimized with relevant keywords\n- Engaging and actionable\n- ${content_type === 'whatsapp' ? 'Include emojis and keep conversational' : ''}\n- ${content_type === 'email' ? 'Include clear call-to-action' : ''}\n- Professional formatting`;

  try {
    // Get Groq API key from environment or config
    const { data: config } = await supabase
      .from('api_config')
      .select('api_key')
      .eq('service', 'groq')
      .single();

    if (!config?.api_key) {
      return { error: 'Groq API key not configured' };
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) throw new Error('Content generation failed');

    const data = await response.json();
    const content = data.choices[0].message.content;

    return {
      success: true,
      content,
      topic,
      content_type,
      tone,
      word_count: content.split(' ').length,
    };
  } catch (error: any) {
    return { error: error.message };
  }
}

async function getContactLists(userId: string) {
  const { data, error } = await supabase
    .from('email_lists')
    .select('id, name, description, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return { error: error.message };

  // Get subscriber counts
  const listsWithCounts = await Promise.all(
    (data || []).map(async (list) => {
      const { count } = await supabase
        .from('email_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('list_id', list.id);
      return { ...list, subscriber_count: count || 0 };
    })
  );

  return { lists: listsWithCounts, count: listsWithCounts.length };
}

async function createEmailCampaign(userId: string, campaign: any) {
  // Find list by name
  const { data: list } = await supabase
    .from('email_lists')
    .select('id')
    .eq('user_id', userId)
    .ilike('name', campaign.list_name)
    .single();

  if (!list) return { error: `List "${campaign.list_name}" not found` };

  // Parse timing
  let scheduledTime = new Date();
  if (campaign.timing) {
    const timing = campaign.timing.toLowerCase();
    if (timing.includes('tomorrow')) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
      scheduledTime.setHours(10, 0, 0, 0);
    } else if (timing.includes('immediate') || timing.includes('now')) {
      // Keep current time
    } else {
      // Try to parse as datetime
      const parsed = new Date(campaign.timing);
      if (!isNaN(parsed.getTime())) scheduledTime = parsed;
    }
  }

  const { data, error } = await supabase
    .from('scheduled_messages')
    .insert({
      user_id: userId,
      list_id: list.id,
      target_type: 'list',
      send_via_email: true,
      send_via_whatsapp: false,
      email_subject: campaign.subject,
      message_body: campaign.body,
      scheduled_time: scheduledTime.toISOString(),
      status: 'pending',
    })
    .select()
    .single();

  if (error) return { error: error.message };

  return {
    success: true,
    campaign_id: data.id,
    list: campaign.list_name,
    scheduled_time: scheduledTime.toISOString(),
    message: `Email campaign scheduled for ${scheduledTime.toLocaleString()}`,
  };
}

async function createWhatsAppCampaign(userId: string, campaign: any) {
  const { data: list } = await supabase
    .from('email_lists')
    .select('id')
    .eq('user_id', userId)
    .ilike('name', campaign.list_name)
    .single();

  if (!list) return { error: `List "${campaign.list_name}" not found` };

  let scheduledTime = new Date();
  if (campaign.timing) {
    const timing = campaign.timing.toLowerCase();
    if (timing.includes('tomorrow')) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
      scheduledTime.setHours(10, 0, 0, 0);
    } else if (timing.includes('immediate') || timing.includes('now')) {
      // Keep current time
    } else {
      const parsed = new Date(campaign.timing);
      if (!isNaN(parsed.getTime())) scheduledTime = parsed;
    }
  }

  const { data, error } = await supabase
    .from('scheduled_messages')
    .insert({
      user_id: userId,
      list_id: list.id,
      target_type: 'list',
      send_via_email: false,
      send_via_whatsapp: true,
      message_body: campaign.message,
      scheduled_time: scheduledTime.toISOString(),
      status: 'pending',
    })
    .select()
    .single();

  if (error) return { error: error.message };

  return {
    success: true,
    campaign_id: data.id,
    list: campaign.list_name,
    scheduled_time: scheduledTime.toISOString(),
    message: `WhatsApp campaign scheduled for ${scheduledTime.toLocaleString()}`,
  };
}

async function createContactList(userId: string, list: any) {
  const { data, error } = await supabase
    .from('email_lists')
    .insert({
      user_id: userId,
      name: list.name,
      description: list.description || '',
      status: 'active',
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { success: true, list_id: data.id, name: data.name };
}

async function addContactsToList(userId: string, params: any) {
  const { data: list } = await supabase
    .from('email_lists')
    .select('id')
    .eq('user_id', userId)
    .ilike('name', params.list_name)
    .single();

  if (!list) return { error: `List "${params.list_name}" not found` };

  let contacts = [];
  try {
    contacts = JSON.parse(params.contacts);
  } catch {
    return { error: 'Invalid contacts format' };
  }

  const subscribers = contacts.map((c: any) => ({
    list_id: list.id,
    first_name: c.name?.split(' ')[0] || c.first_name || '',
    last_name: c.name?.split(' ')[1] || c.last_name || '',
    email: c.email || '',
    phone: c.phone || '',
  }));

  const { error } = await supabase
    .from('email_subscribers')
    .insert(subscribers);

  if (error) return { error: error.message };

  return {
    success: true,
    list: params.list_name,
    contacts_added: subscribers.length,
  };
}
