# Business Tools Implementation Guide

## Database Schema
Run `business-tools-schema.sql` in Supabase to create all tables.

## Pages to Create (13 total)

### 1. Sales Dashboard (`/business/sales`)
- Revenue charts (daily, monthly, yearly)
- Top products/services
- Recent transactions
- Sales trends
**Integration**: Chart library (recharts)

### 2. Cashbook (`/business/cashbook`)
- Add income/expense
- Transaction list with filters
- Balance summary
- Category breakdown
**Database**: cashbook_transactions

### 3. Invoice Generator (`/business/invoices`)
- Create invoice form
- Invoice list
- PDF download button
- Send via email
**Integration**: jsPDF for PDF generation

### 4. Credits & Debits (`/business/credits-debits`)
- Receivables (credits)
- Payables (debits)
- Settlement tracking
**Database**: credits_debits

### 5. Customers (`/business/customers`)
- Customer list (table format)
- Add/edit customer
- Assign to email/WhatsApp lists
- Customer history
**Database**: customers

### 6. Bookkeeping (`/business/bookkeeping`)
- Profit & Loss statement
- Balance sheet
- Financial reports
**Database**: Aggregates from cashbook, invoices

### 7. Staff Attendance (`/business/attendance`)
- Daily attendance table
- Check-in/out buttons
- Attendance history
- Monthly summary
**Database**: staff, attendance

### 8. Salary Management (`/business/salary`)
- Staff salary list
- Payment tracking
- Monthly payroll
**Database**: staff, salary_payments

### 9. Salary Reminders (`/business/salary-reminders`)
- Auto-reminder setup
- Link to email/WhatsApp automation
- Payment due alerts
**Integration**: Uses existing automation system

### 10. Stock Management (`/business/stock`)
- Product list
- Add/edit stock
- Low stock alerts
- Stock movements
**Database**: stock

### 11. Appointments (`/business/appointments`)
- Calendar view
- Add appointment
- Customer assignment
- Status tracking
**Database**: appointments
**Integration**: Calendar library (react-big-calendar)

### 12. Tasks (`/business/tasks`)
- Task list (Kanban or list view)
- Add/edit tasks
- Priority & status
- Due dates
**Database**: tasks

### 13. Spreadsheet AI (`/business/spreadsheet`)
- Upload CSV/Excel
- AI chat interface
- Ask questions about data
- Generate insights
**Integration**: OpenAI/Gemini API + file parsing

## Next Steps
1. Run business-tools-schema.sql in Supabase
2. Create individual page components
3. Add routes to App.tsx
4. Install required packages:
   - `npm install jspdf recharts react-big-calendar`

Would you like me to implement specific pages first?
