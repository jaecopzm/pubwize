# Email Setup Guide

## Problem
Emails are not being sent for:
- New user signups (welcome email)
- Payment failures
- Subscription cancellations
- Article published notifications

## Root Cause
Missing or incorrect `RESEND_API_KEY` environment variable.

## Solution

### 1. Get Resend API Key

1. Go to [Resend.com](https://resend.com)
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **Create API Key**
5. Name it "Pubwize Production" or similar
6. Copy the API key (starts with `re_`)

### 2. Verify Your Domain

**Important:** Resend requires domain verification to send emails from your domain.

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain: `pubwize.com`
4. Add the DNS records Resend provides:
   - TXT record for verification
   - MX records for receiving
   - DKIM records for authentication
5. Wait for verification (usually 5-30 minutes)

### 3. Add Environment Variable

#### Local Development (.env.local)
```bash
RESEND_API_KEY=re_your_api_key_here
```

#### Vercel Production
1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `RESEND_API_KEY`
   - **Value**: `re_your_api_key_here`
   - **Environment**: Production, Preview, Development
5. Click **Save**
6. **Redeploy** your application

### 4. Test Email Sending

Use the test endpoint:

```bash
curl -X POST https://pubwize.com/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","type":"welcome"}'
```

Or visit: `https://pubwize.com/api/email/test?email=your-email@example.com&type=welcome`

### 5. Verify Emails Are Working

Check your server logs for:
- ✅ `[Email] Sent successfully` - Emails are working
- ❌ `RESEND_API_KEY not configured` - API key missing
- ❌ `Resend error: Domain not verified` - Domain needs verification

## Email Types Sent

| Event | Email Type | Trigger |
|-------|-----------|---------|
| User signs up | Welcome | `/api/user/plan` POST |
| Payment succeeds | Payment Success | Paddle webhook `subscription.activated` |
| Payment fails | Payment Failed | Paddle webhook `transaction.payment_failed` |
| Subscription cancelled | Cancellation | Paddle webhook `subscription.canceled` |
| Article published | Published | WordPress publish success |
| Quota warning | Quota Warning | 80% usage reached |

## Troubleshooting

### Emails Not Sending

1. **Check API Key**
   ```bash
   # In your server logs, look for:
   [Email] RESEND_API_KEY not configured!
   ```

2. **Check Domain Verification**
   - Go to Resend dashboard
   - Verify domain status is "Verified"
   - Check DNS records are properly configured

3. **Check Spam Folder**
   - Emails might be delivered but marked as spam
   - Add `hello@pubwize.com` to contacts

4. **Check Resend Logs**
   - Go to Resend dashboard → **Logs**
   - See delivery status and errors

### Testing Locally

1. Add to `.env.local`:
   ```bash
   RESEND_API_KEY=re_your_api_key_here
   NODE_ENV=development
   ```

2. Restart dev server:
   ```bash
   npm run dev
   ```

3. Sign up a new user or trigger an email event

4. Check console for:
   ```
   [Email] Sent successfully: { id: '...', to: '...', type: 'welcome' }
   ```

## Email Templates

All email templates are in `/lib/email/templates/`:
- `welcome-email.tsx` - Welcome email
- `payment-success-optimized.tsx` - Payment success
- `payment-failed-optimized.tsx` - Payment failed
- `subscription-cancelled-optimized.tsx` - Cancellation
- `article-published.tsx` - Article published
- `quota-warning.tsx` - Quota warning

## Cost

Resend pricing:
- **Free tier**: 3,000 emails/month
- **Pro**: $20/month for 50,000 emails
- **Enterprise**: Custom pricing

For most SaaS apps, the free tier is sufficient to start.

## Alternative: Use Resend Test Mode

If you don't want to verify your domain yet, you can use Resend's test mode:

1. In Resend, use a test API key
2. Emails will be sent to your verified email only
3. Good for development/testing

## Security Notes

- Never commit API keys to git
- Use environment variables only
- Rotate keys if exposed
- Use different keys for dev/prod
