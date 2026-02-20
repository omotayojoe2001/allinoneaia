# Paystack Integration - Deployment Steps

## ✅ Files Created/Updated

### Database
- `supabase/migrations/006_paystack_setup.sql` - Paystack config & payment tables

### Backend
- `supabase/functions/verify-payment/index.ts` - Payment verification edge function

### Frontend
- `src/lib/paystack.ts` - Paystack service
- `src/lib/pricing-manager.ts` - Updated with Paystack flow
- `src/pages/social/GrowthServices.tsx` - Updated order handler
- `index.html` - Added Paystack script

## 🚀 Deployment Steps

### Step 1: Run SQL Migration
```sql
-- In Supabase SQL Editor, run:
supabase/migrations/006_paystack_setup.sql
```

This creates:
- `paystack_config` table with your keys
- `payment_transactions` table for tracking payments

### Step 2: Deploy Edge Function
```bash
# In terminal:
cd c:\Users\PC\Desktop\allinoneaia-main
supabase functions deploy verify-payment
```

### Step 3: Test Payment Flow
1. Go to Growth Services page
2. Click "Order" on any service
3. Fill in link & quantity
4. Click "Place Order"
5. Paystack popup appears
6. Complete payment
7. Order automatically placed with KClaut

## 🔄 Payment Flow

1. **User clicks "Place Order"**
   - Paystack popup opens
   - User pays with card/bank

2. **Payment succeeds**
   - Paystack returns reference
   - System verifies with Paystack API
   - Transaction saved to database

3. **Order placed**
   - System calls KClaut API with YOUR balance
   - Order saved with profit calculation
   - User sees order in "My Orders" tab

4. **You keep profit**
   - User paid: Customer price
   - KClaut charged: Wholesale cost
   - Your profit: Difference (50-70%)

## 💰 Pricing Example

Service: Instagram Followers
- Wholesale: NGN 572.79
- Your markup: 60% = NGN 343.67
- Customer pays: NGN 916.46
- **You keep: NGN 343.67**

## 🔐 Security

- Secret key stored in Supabase (not exposed to frontend)
- Public key used for frontend popup
- Payment verification done server-side
- RLS policies protect user data

## ✅ What's Fixed

1. ✅ Payment integration (Paystack)
2. ✅ Balance check removed (no longer needed)
3. ✅ Proper order flow
4. ✅ Profit tracking
5. ✅ Transaction history
6. ✅ Secure key storage

## 📝 Next Steps

1. Run the SQL migration
2. Deploy edge function
3. Test with small order
4. Monitor payments in Supabase dashboard
