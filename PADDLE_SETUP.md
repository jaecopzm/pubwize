# Paddle Setup Checklist

## ✅ Completed
- [x] Removed all Dodo code and files
- [x] Updated environment variables structure
- [x] Fixed Paddle customer portal integration
- [x] Removed Stripe references from types
- [x] Updated documentation
- [x] Build passes successfully
- [x] No Dodo references remaining

## 🔧 Configuration Needed

### 1. Paddle Dashboard Setup
- [ ] Create Paddle account (or use existing)
- [ ] Switch to Sandbox mode for testing
- [ ] Create products:
  - [ ] Starter Plan (Monthly)
  - [ ] Starter Plan (Annual)
  - [ ] Pro Plan (Monthly)
  - [ ] Pro Plan (Annual)

### 2. Get Paddle Credentials
- [ ] Generate API Key from Paddle Dashboard
- [ ] Copy Webhook Secret
- [ ] Copy all 4 Price IDs

### 3. Update `.env.local`
```bash
PADDLE_ENV=sandbox  # Change to 'production' when ready
PADDLE_API_KEY=your_api_key_here
NEXT_PUBLIC_PADDLE_PRICE_STARTER_MONTHLY=pri_xxx
NEXT_PUBLIC_PADDLE_PRICE_STARTER_ANNUAL=pri_xxx
NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY=pri_xxx
NEXT_PUBLIC_PADDLE_PRICE_PRO_ANNUAL=pri_xxx
PADDLE_WEBHOOK_SECRET=pdl_ntfset_xxx
```

### 4. Configure Paddle Webhook
**Webhook URL:** `https://yourdomain.com/api/paddle/webhook`

**Events to subscribe to:**
- [ ] `subscription.activated`
- [ ] `subscription.updated`
- [ ] `subscription.canceled`
- [ ] `subscription.past_due`
- [ ] `subscription.paused`
- [ ] `transaction.completed`
- [ ] `transaction.payment_failed`

### 5. Test Integration
- [ ] Test checkout flow (sandbox mode)
- [ ] Verify webhook receives events
- [ ] Check Firestore user document updates
- [ ] Test customer portal access
- [ ] Verify email notifications sent
- [ ] Test subscription cancellation

### 6. Go Live
- [ ] Switch Paddle to Production mode
- [ ] Update `PADDLE_ENV=production` in `.env.local`
- [ ] Update webhook URL to production domain
- [ ] Test one real transaction
- [ ] Monitor webhook logs

## 📚 Key Files

### Paddle Integration
- `lib/paddle.ts` - Paddle client & price ID mapping
- `app/actions/paddle.ts` - Checkout & customer portal
- `app/api/paddle/webhook/route.ts` - Webhook handler

### UI Components
- `components/pricing/pricing-cards.tsx` - Main pricing page
- `components/pricing/compact-pricing-cards.tsx` - Compact version
- `components/billing-management.tsx` - Settings page billing

### Types
- `lib/types.ts` - UserDoc with Paddle fields

## 🔗 Paddle Resources
- Dashboard: https://vendors.paddle.com/
- Sandbox: https://sandbox-vendors.paddle.com/
- Docs: https://developer.paddle.com/
- Webhook Events: https://developer.paddle.com/webhooks/overview
