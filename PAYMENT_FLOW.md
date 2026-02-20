# Payment Flow After Success

## Current Flow (Step by Step)

### 1. User Clicks "Place Order"
- Form validated (link, quantity, min/max)
- `handlePaymentAndOrder()` called in GrowthServices.tsx

### 2. Payment Initialization
- `pricingManager.processOrder()` called
- Pricing calculated (wholesale + markup)
- `paystackService.initializePayment()` opens Paystack modal
- Transaction saved to `payment_transactions` table (status: pending)

### 3. User Pays via Paystack
- User selects payment method (Card/Bank Transfer/USSD)
- Completes payment
- Paystack callback triggered with reference

### 4. Payment Verification
- `paystackService.verifyPayment(reference)` called
- Calls Edge Function: `verify-payment`
- Edge Function verifies with Paystack API
- Updates `payment_transactions` (status: success)

### 5. Order Placement with KClaut
- `kclautAPI.addOrder()` called
- Order placed using YOUR KClaut balance
- KClaut returns order ID

### 6. Save Order to Database
- Order saved to `social_orders` table with:
  - user_id
  - kclaut_order_id
  - service details
  - wholesale_cost (what you paid)
  - user_price (what customer paid)
  - profit (your earnings)
  - payment_status: "completed"
  - payment_intent_id: Paystack reference

### 7. Link Payment to Order
- `payment_transactions` updated with order_id
- Creates link between payment and order

### 8. Update Balance Display
- `updateKClautBalance()` called
- Fetches fresh balance from KClaut
- Updates display

### 9. Success Feedback
- Toast notification: "Payment successful! Order placed."
- Order dialog closes
- Form resets
- Orders list refreshes
- User sees new order in "My Orders" tab

## What Happens to Money

### Customer Side:
- Customer pays: NGN 916.46 → Goes to YOUR Paystack account

### Your Side:
- KClaut charges: NGN 572.79 → Deducted from YOUR KClaut balance
- Your profit: NGN 343.67 → Stays in your Paystack account

## Database Records Created

### payment_transactions
```
id: uuid
user_id: customer's user id
reference: ORDER_1234567890_abc123
amount: 916.46
currency: NGN
status: success
paystack_response: {full paystack data}
order_id: linked order uuid
verified_at: timestamp
```

### social_orders
```
id: uuid
user_id: customer's user id
kclaut_order_id: 12345 (from KClaut)
service_id: 7910
service_name: "Nigerian Facebook Post Likes"
platform: Facebook
link: customer's link
quantity: 100
wholesale_cost: 572.79
markup_percentage: 60
user_price: 916.46
profit: 343.67
payment_status: completed
payment_intent_id: ORDER_1234567890_abc123
status: pending (updated later by KClaut)
```

## Order Status Updates

After order is placed, status can be updated:
1. User clicks "Update" button on order
2. System calls `kclautAPI.getOrderStatus(kclaut_order_id)`
3. Gets current status from KClaut (Pending/In Progress/Completed)
4. Updates `social_orders` table

## Error Handling

### Payment Fails:
- User sees error toast
- Transaction stays "pending" in database
- No order placed with KClaut
- No money charged

### Payment Succeeds but KClaut Fails:
- Payment verified and saved
- KClaut order fails
- Error returned to user
- Manual intervention needed (refund or retry)

### Payment Cancelled:
- User closes Paystack modal
- Error: "Payment cancelled by user"
- Transaction stays "pending"
- No charges

## Z-Index Fix

Added CSS to fix Paystack modal buttons:
```css
.paystack-checkout-iframe,
.paystack-container {
  z-index: 999999 !important;
}
```

This ensures Paystack modal appears above all other elements and buttons are clickable.
