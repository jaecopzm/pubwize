# Email Notifications Implementation Guide

## Overview
Complete email notification system using Resend with beautiful, responsive templates and automated triggers.

## Setup

### 1. Install Resend
```bash
npm install resend
```

### 2. Add Environment Variable
```env
RESEND_API_KEY=re_your_api_key_here
```

### 3. Verify Domain
Your domain `pubwize.com` is already verified on Resend, so emails will be sent from `noreply@pubwize.com`.

## Email Types

### 1. Welcome Email
**Trigger**: User signs up
**Template**: `lib/email/templates/welcome-email.tsx`
**Features**:
- Personalized greeting
- Account info (5 articles/month)
- Feature highlights
- CTA to dashboard

**Usage**:
```typescript
import { sendWelcomeEmail } from '@/lib/email/email-service';

await sendWelcomeEmail(
  'user@example.com',
  'John Doe'
);
```

### 2. Article Published
**Trigger**: Article successfully published to WordPress
**Template**: `lib/email/templates/article-published.tsx`
**Features**:
- Article title
- Links to WordPress and dashboard
- Next steps suggestions

**Usage**:
```typescript
import { sendArticlePublishedEmail } from '@/lib/email/email-service';

await sendArticlePublishedEmail({
  userEmail: 'user@example.com',
  userName: 'John Doe',
  articleId: 'abc123',
  articleTitle: 'How to Create SEO Content',
  wordPressUrl: 'https://site.com/article',
});
```

### 3. Quota Warning
**Trigger**: User reaches 80% or 100% of monthly limit
**Template**: `lib/email/templates/quota-warning.tsx`
**Features**:
- Usage stats (4/5 articles)
- Percentage indicator
- Upgrade benefits
- CTA to pricing page

**Usage**:
```typescript
import { sendQuotaWarningEmail } from '@/lib/email/email-service';

// 80% warning
await sendQuotaWarningEmail({
  userEmail: 'user@example.com',
  userName: 'John Doe',
  currentUsage: 4,
  limit: 5,
  percentage: 80,
});

// 100% exceeded
await sendQuotaWarningEmail({
  userEmail: 'user@example.com',
  userName: 'John Doe',
  currentUsage: 5,
  limit: 5,
  percentage: 100,
});
```

### 4. WordPress Publish Success
**Trigger**: Article published to WordPress
**Usage**:
```typescript
import { sendWordPressPublishSuccessEmail } from '@/lib/email/email-service';

await sendWordPressPublishSuccessEmail({
  userEmail: 'user@example.com',
  userName: 'John Doe',
  articleTitle: 'My Article',
  wordPressUrl: 'https://site.com/article',
  siteName: 'My Blog',
});
```

### 5. WordPress Publish Failed
**Trigger**: WordPress publish fails
**Usage**:
```typescript
import { sendWordPressPublishFailedEmail } from '@/lib/email/email-service';

await sendWordPressPublishFailedEmail({
  userEmail: 'user@example.com',
  userName: 'John Doe',
  articleTitle: 'My Article',
  errorMessage: 'Connection timeout',
  siteName: 'My Blog',
});
```

### 6. Weekly Summary
**Trigger**: Cron job (weekly)
**Usage**:
```typescript
import { sendWeeklySummaryEmail } from '@/lib/email/email-service';

await sendWeeklySummaryEmail({
  userEmail: 'user@example.com',
  userName: 'John Doe',
  stats: {
    articlesCreated: 5,
    articlesPublished: 3,
    totalWords: 7500,
    avgSeoScore: 85,
  },
});
```

## Integration Points

### 1. User Signup (Firebase Auth)
```typescript
// app/auth/signup/page.tsx or Firebase Cloud Function
import { sendWelcomeEmail } from '@/lib/email/email-service';

// After user creation
await sendWelcomeEmail(user.email, user.displayName);
```

### 2. Article Generation
```typescript
// After article is created
import { sendQuotaWarningEmail } from '@/lib/email/email-service';
import { getUserUsage } from '@/lib/usage-tracking';

const usage = await getUserUsage(userId);
const percentage = (usage.articlesGenerated / usage.limit) * 100;

if (percentage >= 80) {
  await sendQuotaWarningEmail({
    userEmail: user.email,
    userName: user.name,
    currentUsage: usage.articlesGenerated,
    limit: usage.limit,
    percentage: Math.round(percentage),
  });
}
```

### 3. WordPress Publishing
```typescript
// app/api/wordpress/publish/route.ts
import { sendArticlePublishedEmail, sendWordPressPublishFailedEmail } from '@/lib/email/email-service';

try {
  // Publish to WordPress
  const result = await publishToWordPress(article);
  
  // Send success email
  await sendArticlePublishedEmail({
    userEmail: user.email,
    userName: user.name,
    articleId: article.id,
    articleTitle: article.title,
    wordPressUrl: result.url,
  });
} catch (error) {
  // Send failure email
  await sendWordPressPublishFailedEmail({
    userEmail: user.email,
    userName: user.name,
    articleTitle: article.title,
    errorMessage: error.message,
    siteName: site.name,
  });
}
```

## Template Customization

### Base Template
All emails use the base template (`lib/email/templates/base-template.tsx`) which includes:
- Pubwize branding
- Responsive design
- Consistent styling
- Footer with links

### Custom Colors
```typescript
// Gold gradient
background: linear-gradient(135deg, #D4AF37 0%, #14B8A6 100%)

// Info box colors
info: { bg: '#eff6ff', border: '#3b82f6' }
success: { bg: '#f0fdf4', border: '#10b981' }
warning: { bg: '#fffbeb', border: '#f59e0b' }
error: { bg: '#fef2f2', border: '#ef4444' }
```

### Components
```typescript
import { Heading, Paragraph, Button, InfoBox, Divider } from './base-template';

<Heading>Title</Heading>
<Paragraph>Content</Paragraph>
<Button href="https://...">Click Me</Button>
<InfoBox type="success" title="Success">Message</InfoBox>
<Divider />
```

## Testing

### Development Testing
```bash
# Test welcome email
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"type": "welcome", "email": "your@email.com"}'

# Test article published
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"type": "article_published", "email": "your@email.com"}'

# Test quota warning
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"type": "quota_warning", "email": "your@email.com"}'

# Test quota exceeded
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"type": "quota_exceeded", "email": "your@email.com"}'
```

### Resend Dashboard
1. Go to https://resend.com/emails
2. View sent emails
3. Check delivery status
4. View email content

## Best Practices

### 1. Error Handling
```typescript
try {
  await sendEmail(...);
} catch (error) {
  // Log error but don't break the flow
  logger.error('Email failed', error);
  // Continue with the main operation
}
```

### 2. Async Sending
```typescript
// Don't await if email isn't critical
sendWelcomeEmail(email, name).catch(console.error);

// Or use Promise.allSettled for batch
await Promise.allSettled([
  sendEmail1(),
  sendEmail2(),
  sendEmail3(),
]);
```

### 3. Rate Limiting
Resend has rate limits:
- Free: 100 emails/day
- Pro: 50,000 emails/month

Monitor usage in Resend dashboard.

### 4. Unsubscribe
Add unsubscribe link to marketing emails:
```typescript
<a href="${BASE_URL}/unsubscribe?email=${email}">
  Unsubscribe
</a>
```

### 5. Personalization
Always use user's name:
```typescript
Hi ${userName}, // Good
Hi there, // Less personal
```

## Monitoring

### Resend Analytics
- Open rates
- Click rates
- Bounce rates
- Spam complaints

### Application Logs
```typescript
import { logger } from '@/lib/logger';

logger.info('Email sent', { 
  type: 'welcome',
  email: user.email,
  timestamp: new Date(),
});
```

## Troubleshooting

### Email not sending
1. Check RESEND_API_KEY is set
2. Verify domain in Resend dashboard
3. Check logs for errors
4. Test with `/api/email/test`

### Email in spam
1. Verify domain (SPF, DKIM, DMARC)
2. Avoid spam trigger words
3. Include unsubscribe link
4. Warm up sending (start slow)

### Template not rendering
1. Check HTML syntax
2. Test in email client
3. Use inline styles (no external CSS)
4. Test responsive design

## Future Enhancements

### Short Term
- [ ] Email preferences page
- [ ] Unsubscribe functionality
- [ ] Email templates in dashboard
- [ ] A/B testing

### Long Term
- [ ] Transactional email analytics
- [ ] Email scheduling
- [ ] Drip campaigns
- [ ] Newsletter functionality

## Resources

- [Resend Documentation](https://resend.com/docs)
- [Email Best Practices](https://www.campaignmonitor.com/resources/guides/email-marketing-best-practices/)
- [HTML Email Guide](https://www.campaignmonitor.com/css/)

## Support

For issues:
1. Check Resend dashboard
2. Review application logs
3. Test with `/api/email/test`
4. Contact Resend support
