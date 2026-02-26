// Page-specific AI agent configurations
export const pageAgentConfigs = {
  dashboard: {
    pageName: 'Dashboard',
    pageContext: 'Main dashboard showing business overview, revenue, expenses, tasks, appointments, and reminders',
    availableActions: [
      'View business statistics',
      'Check overdue reminders',
      'See recent activities',
      'Get revenue summary',
      'Check pending tasks',
      'View upcoming appointments'
    ]
  },
  
  tasks: {
    pageName: 'Tasks',
    pageContext: 'Task management page for creating, viewing, and managing tasks',
    availableActions: [
      'Create new task',
      'Mark task as complete',
      'View pending tasks',
      'Get high priority tasks',
      'Search tasks',
      'Update task details'
    ]
  },
  
  appointments: {
    pageName: 'Appointments',
    pageContext: 'Appointment scheduling and management page',
    availableActions: [
      'Create new appointment',
      'View upcoming appointments',
      'Cancel appointment',
      'Reschedule appointment',
      'Get today\'s appointments',
      'View appointment history'
    ]
  },
  
  customers: {
    pageName: 'Customers',
    pageContext: 'Customer database and management page',
    availableActions: [
      'Add new customer',
      'Search customers',
      'Update customer info',
      'View customer invoices',
      'Get customer payment history',
      'View top customers'
    ]
  },
  
  stock: {
    pageName: 'Stock Management',
    pageContext: 'Inventory and stock management page',
    availableActions: [
      'Add new stock item',
      'Update stock quantity',
      'Check low stock alerts',
      'View stock value',
      'Get best selling products',
      'Search stock items'
    ]
  },
  
  automation: {
    pageName: 'Automation',
    pageContext: 'Email and WhatsApp automation page for campaigns and sequences',
    availableActions: [
      'Create email campaign',
      'Create WhatsApp campaign',
      'Generate marketing content',
      'View contact lists',
      'Create contact list',
      'Schedule messages'
    ]
  },
  
  chatbot: {
    pageName: 'Chatbot Builder',
    pageContext: 'WhatsApp chatbot creation and management page',
    availableActions: [
      'Create chatbot flow',
      'Test chatbot',
      'View chatbot analytics',
      'Update chatbot responses',
      'Configure chatbot settings'
    ]
  },
  
  content: {
    pageName: 'Content Studio',
    pageContext: 'Content creation and management page for social media and marketing',
    availableActions: [
      'Generate SEO content',
      'Create social media post',
      'Schedule content',
      'View content calendar',
      'Generate blog post',
      'Create email template'
    ]
  },
  
  growth: {
    pageName: 'Growth Services',
    pageContext: 'Social media growth and engagement services page. We offer 337+ services for Instagram, TikTok, Facebook, YouTube, LinkedIn and more. Services include followers, likes, views, comments, and engagement. Pricing varies by service and platform. For Facebook: 1000 followers typically costs around $15-25, 2000 followers around $30-50. All services are real, high-quality, and delivered instantly. Users can browse services, place orders, and track delivery.',
    availableActions: [
      'Browse available services',
      'Get pricing for specific service',
      'Check service delivery time',
      'View platform options',
      'Track order status',
      'Get service recommendations'
    ]
  },
  
  social: {
    pageName: 'Social Media Manager',
    pageContext: 'Social media account management and posting page',
    availableActions: [
      'Schedule social post',
      'View post analytics',
      'Manage social accounts',
      'Create content calendar',
      'Track engagement'
    ]
  },
  
  business: {
    pageName: 'Business Tools',
    pageContext: 'Business management tools including cashbook, invoices, staff, and reports',
    availableActions: [
      'Add cashbook entry',
      'Create invoice',
      'View financial reports',
      'Manage staff',
      'Track attendance',
      'Generate salary receipts',
      'Get expense breakdown',
      'View profit margin'
    ]
  },
  
  reminders: {
    pageName: 'Reminders',
    pageContext: 'Reminder creation and management page',
    availableActions: [
      'Create reminder',
      'Delete reminder',
      'View pending reminders',
      'Snooze reminder',
      'Mark reminder complete',
      'Set recurring reminder'
    ]
  },
  
  cashbook: {
    pageName: 'Cashbook',
    pageContext: 'Income and expense tracking page',
    availableActions: [
      'Add income entry',
      'Add expense entry',
      'Get cashbook summary',
      'Search transactions',
      'View expense breakdown',
      'Calculate profit margin',
      'Get cash flow analysis'
    ]
  },
  
  invoices: {
    pageName: 'Invoices',
    pageContext: 'Invoice generation and management page',
    availableActions: [
      'Create new invoice',
      'Mark invoice as paid',
      'View overdue invoices',
      'Get invoice statistics',
      'Update invoice due date',
      'Search invoices',
      'Get unpaid invoices total'
    ]
  },
  
  staff: {
    pageName: 'Staff Management',
    pageContext: 'Employee database and management page',
    availableActions: [
      'Add staff member',
      'View staff list',
      'Get staff by position',
      'Calculate total payroll',
      'Track attendance',
      'Manage salaries'
    ]
  },
  
  reports: {
    pageName: 'Smart Reports',
    pageContext: 'AI-powered business analytics and reporting page',
    availableActions: [
      'Generate financial report',
      'Get revenue comparison',
      'View monthly trends',
      'Calculate tax owed',
      'Get expense income ratio',
      'View weekly summary'
    ]
  }
};

export type PageAgentKey = keyof typeof pageAgentConfigs;
