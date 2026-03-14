# Email Deliverability Best Practices

## Avoiding Spam Filters

### 1. Use Real "From" Address ✅
**Bad**: `noreply@pubwize.com`
**Good**: `hello@pubwize.com` or `team@pubwize.com`

**Why**: "noreply" signals one-way communication and decreases trust. Email providers flag this as potentially spammy.

**Current Setup**:
```typescript
from: 'Pubwize <hello@pubwize.com>'
replyTo: 'support@pubwize.com'
```

### 2. Domain Authentication (Already Done ✅)
Your domain `pubwize.com` is verified on Resend with:
- **SPF**: Sender Policy Framework
- **DKIM**: DomainKeys Identified Mail
- **DMARC**: Domain-based Message Authentication

These prove you own the domain and prevent spoofing.

### 3. Email Content Best Practices

#### Avoid Spam Trigger Words
❌ Avoid:
- FREE, CLICK HERE, ACT NOW
- $$$ or excessive punctuation!!!
- ALL CAPS SUBJECT LINES
- "Dear Friend" or generic greetings

✅ Use:
- Personalized greetings: "Hi John"
- Clear, specific subjects
- Professional tone
- Proper grammar

#### Good Subject Lines
```
✅ "Welcome to Pubwize, John!"
✅ "Your article has been published"
✅ "You've used 80% of your monthly articles"

❌ "FREE ARTICLES!!! CLICK NOW!!!"
❌ "You won't believe this..."
❌ "Re: Re: Re: Important"
```

### 4. HTML Email Best Practices

#### Text-to-Image Ratio
- Keep text-to-image ratio high (more text than images)
- Always include alt text for images
- Provide plain text version

#### Links
- Use descriptive link text (not "click here")
- Don't use URL shorteners
- Limit number of links (3-5 max for transactional emails)

#### Structure
```html
✅ Good:
<a href="https://pubwize.com/dashboard">View Dashboard</a>

❌ Bad:
<a href="https://bit.ly/xyz">Click here!!!</a>
```

### 5. Sender Reputation

#### Warm Up Your Domain
Start slow and increase volume:
- Week 1: 50 emails/day
- Week 2: 100 emails/day
- Week 3: 200 emails/day
- Week 4+: Full volume

#### Monitor Metrics
Track in Resend dashboard:
- **Open Rate**: Aim for >20%
- **Click Rate**: Aim for >2%
- **Bounce Rate**: Keep <2%
- **Spam Complaints**: Keep <0.1%

### 6. List Hygiene

#### Remove Bounces
```typescript
// Track bounces and remove invalid emails
if (bounceRate > 0.05) {
  // Remove email from list
  await removeInvalidEmail(email);
}
```

#### Honor Unsubscribes
```typescript
// Check unsubscribe status before sending
const isUnsubscribed = await checkUnsubscribeStatus(email);
if (isUnsubscribed) {
  return; // Don't send
}
```

### 7. Email Frequency

#### Transactional Emails (Current)
- Welcome: Immediate
- Article Published: Immediate
- Quota Warning: Once at 80%, once at 100%
- WordPress Status: Immediate

#### Marketing Emails (Future)
- Weekly Summary: Once per week
- Product Updates: Max 2x per month
- Newsletters: Max 1x per week

### 8. Unsubscribe Link

Always include an easy unsubscribe option:

```html
<p style="font-size: 12px; color: #6b7280; text-align: center;">
  Don't want these emails? 
  <a href="https://pubwize.com/unsubscribe?email={{email}}" 
     style="color: #D4AF37;">
    Unsubscribe
  </a>
</p>
```

### 9. Physical Address

Include your business address in footer:

```html
<p style="font-size: 12px; color: #9ca3af; text-align: center;">
  Pubwize Inc.<br>
  123 Business St, Suite 100<br>
  San Francisco, CA 94105
</p>
```

### 10. Engagement Signals

#### Encourage Interaction
- Ask questions
- Include clear CTAs
- Make it easy to reply
- Provide value in every email

#### Example:
```
"Have questions? Just reply to this email - we read every message!"
```

## Implementation Checklist

### Immediate (Done ✅)
- [x] Change from `noreply@` to `hello@`
- [x] Add reply-to address
- [x] Domain verification (SPF, DKIM, DMARC)
- [x] Responsive HTML templates
- [x] Personalized greetings

### Short Term (To Do)
- [ ] Add unsubscribe functionality
- [ ] Add physical address to footer
- [ ] Implement bounce tracking
- [ ] Monitor deliverability metrics
- [ ] Set up email preferences page

### Long Term (Future)
- [ ] A/B test subject lines
- [ ] Segment email lists
- [ ] Implement re-engagement campaigns
- [ ] Add email analytics dashboard

## Testing Deliverability

### 1. Mail Tester
Send test email to: https://www.mail-tester.com
- Get a score out of 10
- Aim for 8+ score
- Fix any issues identified

### 2. Gmail Postmaster Tools
Monitor your domain reputation:
https://postmaster.google.com

### 3. Seed List Testing
Send to multiple providers:
- Gmail
- Outlook
- Yahoo
- ProtonMail
- Apple Mail

Check:
- Inbox vs Spam folder
- Rendering on different clients
- Links work correctly

## Monitoring

### Daily
- Check Resend dashboard for bounces
- Monitor spam complaints
- Review delivery rates

### Weekly
- Analyze open rates
- Check click rates
- Review unsubscribe rate
- Test email rendering

### Monthly
- Full deliverability audit
- Update email content based on metrics
- Clean email list (remove bounces)
- Review and optimize templates

## Red Flags to Avoid

### Content
- ❌ Excessive exclamation marks!!!
- ❌ All caps SUBJECT LINES
- ❌ Misleading subject lines
- ❌ Hidden text (white text on white background)
- ❌ Excessive images with little text

### Technical
- ❌ Broken links
- ❌ Missing unsubscribe link
- ❌ No plain text version
- ❌ Large file attachments
- ❌ Suspicious sender name

### Behavior
- ❌ Sending to purchased lists
- ❌ Sending without permission
- ❌ Ignoring unsubscribe requests
- ❌ Sudden volume spikes
- ❌ High bounce rates

## Email Addresses to Set Up

### Primary Addresses
1. **hello@pubwize.com** - Main sending address (friendly, inviting)
2. **support@pubwize.com** - Customer support (reply-to)
3. **team@pubwize.com** - Team updates (alternative)

### Functional Addresses
4. **notifications@pubwize.com** - System notifications
5. **billing@pubwize.com** - Payment/invoice emails
6. **security@pubwize.com** - Security alerts

### Setup in Resend
1. Go to Resend dashboard
2. Add email addresses
3. Verify each address
4. Update code to use appropriate address per email type

## Current Configuration

```typescript
// lib/email/resend-client.ts
export const EMAIL_CONFIG = {
  from: 'Pubwize <hello@pubwize.com>',      // ✅ Friendly, not noreply
  replyTo: 'support@pubwize.com',           // ✅ Real support address
} as const;
```

## Resources

- [Resend Best Practices](https://resend.com/docs/knowledge-base/best-practices)
- [Gmail Sender Guidelines](https://support.google.com/mail/answer/81126)
- [Email Deliverability Guide](https://www.validity.com/resource-center/email-deliverability-guide/)
- [Mail Tester](https://www.mail-tester.com)
- [Gmail Postmaster Tools](https://postmaster.google.com)

## Support

If deliverability issues persist:
1. Check Resend dashboard for errors
2. Test with Mail Tester
3. Review spam complaints
4. Contact Resend support
5. Adjust content and sending patterns

## Summary

✅ **Changed**: `noreply@` → `hello@`
✅ **Added**: Real reply-to address
✅ **Verified**: Domain authentication
✅ **Implemented**: Best practices in templates
✅ **Ready**: For high deliverability

Your emails should now have excellent deliverability and avoid spam filters!
