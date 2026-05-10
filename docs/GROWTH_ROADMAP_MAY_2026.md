# Pubwize Growth Roadmap

Date: May 10, 2026

## Goal

Increase customer acquisition, activation, and paid conversion by tightening trust, instrumenting the funnel, and adding the missing revenue loops already implied by the product positioning.

## Executive Summary

Pubwize already has strong product breadth:

- Keyword research
- Brief -> outline -> draft workflow
- SEO scoring
- WordPress publishing
- Social repurposing
- Billing and onboarding basics

What is missing is not mostly "more AI features". The biggest gaps are:

1. No reliable funnel instrumentation
2. Thin trust and proof layer
3. Weak activation and lifecycle automation
4. Agency/team messaging without agency/team product support
5. Churn and win-back loops are incomplete
6. Some conversion messaging is disconnected from actual product behavior

## Priority Matrix

### P0: Immediate revenue protection

These are the items that can directly damage trust or waste traffic.

1. Remove unsupported discount/promotional claims
   - Status: partially fixed
   - Files:
     - `components/exit-intent-popup.tsx`
     - `components/upgrade-cta.tsx`
   - Reason:
     - The app referenced `discount=first20` without any checkout implementation.
     - Fake offers lower trust and hurt checkout conversion.

2. Add a real cancellation feedback page
   - Files:
     - `lib/email/email-service.ts`
     - new `app/feedback/page.tsx`
     - optional `app/api/feedback/route.ts`
   - Reason:
     - Cancellation emails already link to `/feedback`, but that page does not exist.
     - This loses the easiest churn-learning moment.

3. Add billing event visibility in-app
   - Files:
     - `app/dashboard/settings/page.tsx`
     - `app/api/user/plan/route.ts`
   - Reason:
     - Users need clean post-checkout states: processing, active, failed, canceled, reactivated.
     - Ambiguous billing state creates support load and silent churn.

### P1: Funnel instrumentation

Without measurement, growth work is guesswork.

1. Add product analytics event tracking
   - Files:
     - `components/google-analytics.tsx`
     - new `lib/analytics.ts`
     - `app/page.tsx`
     - `app/sign-up/[[...sign-up]]/page.tsx`
     - `app/dashboard/articles/new/page.tsx`
     - `app/dashboard/sites/new/page.tsx`
     - `components/pricing/pricing-cards.tsx`
     - `components/pricing/compact-pricing-cards.tsx`
     - `app/dashboard/settings/page.tsx`
     - `components/exit-intent-popup.tsx`
   - Track at minimum:
     - Landing CTA clicked
     - Pricing CTA clicked
     - Sign-up started
     - Sign-up completed
     - First site created
     - First brief generated
     - First article drafted
     - WordPress connected
     - Checkout opened
     - Checkout success page visited
     - Subscription activated from webhook
     - Cancellation initiated
     - Reactivation clicked

2. Define funnel dashboards
   - Files:
     - `app/api/admin/stats/route.ts`
     - `app/admin/page.tsx`
     - new lightweight event store or external analytics sink
   - Required funnel:
     - Visitor -> signup -> first article -> first publish -> paid

### P1: Activation improvements

Pubwize needs to get users to "first value" faster.

1. Replace click-based onboarding with milestone-based onboarding
   - Files:
     - `components/onboarding/quick-start-guide.tsx`
     - `lib/hooks/use-onboarding.ts`
     - `app/dashboard/page.tsx`
     - `app/api/user/plan/route.ts`
   - Milestones should come from actual product actions:
     - Site created
     - First article created
     - First draft generated
     - WordPress connected
     - First publish completed

2. Add a true "publish your first article" onboarding track
   - Files:
     - `app/dashboard/page.tsx`
     - `components/onboarding/welcome-modal.tsx`
     - `components/onboarding/quick-start-guide.tsx`
     - `components/wordpress/wordpress-connection-dialog.tsx`
   - Reason:
     - "Generated content" is not the product outcome.
     - "Published and useful content" is the activation event that should correlate with retention.

3. Add lifecycle nudges based on inactivity or stuck states
   - Files:
     - `app/api/user/usage/route.ts`
     - `lib/email/email-service.ts`
     - new background job or cron route
   - Trigger examples:
     - Signed up, no site after 24h
     - Site created, no article after 24h
     - Brief created, no draft after 24h
     - Draft created, not published after 3 days

### P1: Trust and proof

The product looks polished, but proof is still weak.

1. Replace synthetic proof with real proof
   - Files:
     - `components/landing/success-feed.tsx`
     - `components/social-proof-badges.tsx`
     - `app/page.tsx`
   - Replace with:
     - Real customer logos
     - Real published article examples
     - Real testimonials with names/roles/sites
     - Real metrics like "articles published", "sites connected", "time saved"
   - Important:
     - If numbers are not verified, do not show them.

2. Add review schema and testimonial content
   - Files:
     - `lib/seo/structured-data.ts`
     - `app/page.tsx`
   - Reason:
     - The code already notes reviews are missing.
     - This helps both conversion and SEO.

3. Add concrete sample outputs
   - Files:
     - `app/page.tsx`
     - `components/landing/hero-demo.tsx`
     - new `app/examples/page.tsx`
   - Add:
     - Example briefs
     - Example outlines
     - Example before/after article improvements
     - Example published article screenshots

### P2: Acquisition content

You need more search-surface and comparison intent coverage.

1. Build high-intent comparison pages
   - New pages:
     - `app/pubwize-vs-jasper/page.tsx`
     - `app/pubwize-vs-copy-ai/page.tsx`
     - `app/pubwize-vs-content-agency/page.tsx`
   - Reason:
     - Buyers searching alternatives are closer to purchase than generic blog readers.

2. Expand SEO content around free tools and workflow pain
   - New page ideas:
     - free SEO brief generator
     - article outline generator
     - SERP title/meta preview tool
     - keyword clustering guide/tool
   - Existing files to extend:
     - `content/blog/*`
     - `app/blog/page.tsx`

3. Add intent-specific landing pages
   - New pages:
     - for bloggers
     - for affiliate sites
     - for agencies
     - for WordPress publishers
   - Reason:
     - Your current messaging tries to cover everyone at once.

### P2: Monetization and expansion

1. Add agency-ready capabilities
   - Likely new data model and UI areas
   - Minimum features:
     - Team invites
     - Shared workspace
     - Client review/approval links
     - Shared brand voice packs
     - Shared template library
   - Why:
     - The site already sells to agencies in copy, but the product does not yet support that buyer well.

2. Add annual-plan-first positioning
   - Files:
     - `components/pricing/pricing-cards.tsx`
     - `components/pricing/compact-pricing-cards.tsx`
     - `app/dashboard/settings/page.tsx`
   - Reason:
     - Annual lowers churn and improves cash collection.

3. Add a real upgrade path tied to usage and value
   - Files:
     - `components/usage-warning-banner.tsx`
     - `components/pricing/upgrade-modal.tsx`
     - `components/upgrade-cta.tsx`
     - `app/api/analytics/route.ts`
   - Instead of generic “upgrade now”, show:
     - articles remaining
     - estimated hours saved
     - upcoming blocked features

### P2: Retention and churn reduction

1. Add cancel flow with rescue options
   - Files:
     - `components/billing-management.tsx`
     - `app/api/billing/cancel-subscription/route.ts`
     - new `app/api/billing/cancel-feedback/route.ts`
   - Rescue offers:
     - pause instead of cancel
     - downgrade to starter
     - talk to support
     - “need fewer articles this month?”

2. Add a real feedback collection loop
   - Files:
     - new `app/feedback/page.tsx`
     - new `app/api/feedback/route.ts`
     - optional admin view in `app/admin/`
   - Capture:
     - reason for canceling
     - what almost kept them
     - what tool they switched to

3. Add win-back campaigns
   - Files:
     - `lib/email/email-service.ts`
     - `lib/email/templates/*`
   - Triggers:
     - churned but still logging in
     - inactive free user with site connected
     - user hit usage ceiling repeatedly but never upgraded

## Recommended Implementation Order

### Sprint 1

- Add analytics tracking foundation
- Add `/feedback` page and persistence
- Clean billing state UX
- Remove any remaining unsupported promotional claims

### Sprint 2

- Convert onboarding to milestone-based progress
- Add lifecycle emails for activation
- Improve in-app upgrade prompts with actual usage/value context
- Add real proof sections on homepage

### Sprint 3

- Launch comparison pages
- Launch role-based landing pages
- Add cancel rescue flow
- Add win-back campaigns

### Sprint 4

- Build first agency features
- Expand template sharing and collaboration
- Add customer proof assets and case studies

## Highest-Leverage KPIs

Track these before and after each change:

- Visitor -> signup conversion rate
- Signup -> first site created
- Signup -> first article created
- Signup -> first publish
- First publish -> paid conversion
- Free -> paid conversion
- Starter -> Pro conversion
- Checkout open -> checkout success
- 30-day activation retention
- Monthly churn rate
- Annual plan mix

## Suggested Immediate Build Tickets

1. Analytics foundation
   - Create `lib/analytics.ts`
   - Add typed event helpers
   - Wire CTAs, onboarding milestones, and billing events

2. Cancellation feedback flow
   - Add `app/feedback/page.tsx`
   - Add `app/api/feedback/route.ts`
   - Update cancel email destination if needed

3. Milestone-based onboarding
   - Replace local click completion with API-backed progress

4. Homepage trust pass
   - Remove unverifiable proof
   - Add real testimonials and examples only

5. Upgrade prompt rewrite
   - Base copy on actual usage and blocked outcomes

## Notes

- Do not ship fake urgency, fake discounts, or synthetic social proof.
- Do not add more top-of-funnel content before measuring activation and paid conversion.
- Do not build agency-focused landing copy further unless the product begins to support team workflows.
