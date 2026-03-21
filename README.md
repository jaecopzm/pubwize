# Pubwize

SEO article workflow platform with Firebase Auth, Firestore, and Gemini AI.

## Dashboard Structure

The application features a modern dashboard with sidebar navigation and organized screens following industry standards.

### Navigation
- **Overview** (`/dashboard`) - Dashboard home with stats and quick actions
- **Articles** (`/dashboard/articles`) - List and manage all articles
  - Create new articles with SEO brief generation
  - View article workflow: Brief → Outline → Draft → Optimization
- **Sites** (`/dashboard/sites`) - Manage site configurations
  - Create, edit, and manage multiple sites
  - Configure niche, brand voice (per-site adjectives + persona details), and target audience
- **Settings** (`/dashboard/settings`) - Account and subscription settings

### Key Features
- Persistent sidebar navigation with active state indicators
- Separate screens for each major feature
- Clean, industry-standard layout with proper authentication flow
- Responsive design with Tailwind CSS and shadcn/ui components
- Type-safe with TypeScript
- Protected routes with Firebase Authentication

### File Structure
```
app/
├── dashboard/
│   ├── layout.tsx              # Dashboard layout wrapper
│   ├── page.tsx                # Overview/home page
│   ├── articles/
│   │   ├── page.tsx            # Articles list
│   │   ├── new/
│   │   │   └── page.tsx        # Create new article
│   │   └── [id]/
│   │       └── page.tsx        # Article detail/workflow
│   ├── sites/
│   │   ├── page.tsx            # Sites list
│   │   └── new/
│   │       └── page.tsx        # Create new site
│   └── settings/
│       └── page.tsx            # User settings
components/
└── dashboard/
    ├── sidebar.tsx             # Sidebar navigation component
    └── layout-wrapper.tsx      # Auth wrapper with sidebar
```

## Getting Started

First, set up your environment variables in `.env.local`:

```bash
# Firebase configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Gemini AI
GEMINI_API_KEY=

# Paddle (Billing)
PADDLE_ENV=sandbox
PADDLE_API_KEY=
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=
NEXT_PUBLIC_PADDLE_PRICE_STARTER_MONTHLY=
NEXT_PUBLIC_PADDLE_PRICE_STARTER_ANNUAL=
NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY=
NEXT_PUBLIC_PADDLE_PRICE_PRO_ANNUAL=
PADDLE_WEBHOOK_SECRET=
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result in development.

For production, visit [https://pubwize.com](https://pubwize.com).

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **AI**: Google Gemini
- **UI**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React
- **Language**: TypeScript

## Features

### Article Workflow
1. **Brief Generation** - AI-powered SEO brief with headings, questions, entities
2. **Outline Creation** - Structured outline based on the brief
3. **Draft Generation** - Full article draft in markdown
4. **SEO Optimization** - On-page SEO analysis and suggestions

### Site Management
- Multi-site support
- Site-specific configurations (niche, brand voice adjectives/tone/rules, target country)
- Reusable site context across articles

## License

MIT
