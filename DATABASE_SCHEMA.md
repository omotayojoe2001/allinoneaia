# Database Schema Reference for AI Agent

## Actual Tables and Columns

### cashbook_transactions
- user_id
- type (income/expense)
- amount (number)
- category
- description
- date

### invoices
- user_id
- invoice_number
- customer_id (FK to customers)
- currency
- items (JSON)
- subtotal
- tax
- delivery_fee
- amount (total)
- due_date
- payment_status (unpaid/paid/partial)
- notes
- created_at

### customers
- user_id
- name
- email
- address
- phone

### appointments
- user_id
- customer_id (FK to customers)
- title
- date
- status (scheduled/completed/cancelled)
- location
- notes

### stock
- user_id
- product_name
- quantity
- reorder_level
- sku
- price
- cost

### staff
- user_id
- name
- salary
- position
- phone
- email

### tasks
- user_id
- title
- description
- due_date
- status (pending/completed)
- assigned_to
- priority

### reminders
- user_id
- category
- title
- description
- due_date
- priority (low/medium/high/urgent)
- status (pending/sent/completed/cancelled)

## Key Differences from Assumptions
- ❌ NOT `cashbook` → ✅ `cashbook_transactions`
- ❌ NOT `inventory` → ✅ `stock`
- ❌ NOT `status` → ✅ `payment_status` (for invoices)
- ❌ NOT `total_amount` → ✅ `amount` (for invoices)
- ❌ NOT `customer_name` column → ✅ Join with `customers` table
- ❌ NOT `appointment_date` → ✅ `date` (for appointments)
