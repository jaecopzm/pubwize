import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const checks = {
    resendApiKey: !!process.env.RESEND_API_KEY,
    resendApiKeyFormat: process.env.RESEND_API_KEY?.startsWith('re_') || false,
    nodeEnv: process.env.NODE_ENV,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    emailsConfigured: !!process.env.RESEND_API_KEY,
  };

  const status = checks.emailsConfigured ? 'configured' : 'not_configured';
  const message = checks.emailsConfigured
    ? '✅ Email service is configured'
    : '❌ Email service is NOT configured - add RESEND_API_KEY to environment variables';

  return NextResponse.json({
    status,
    message,
    checks,
    help: 'See /docs/EMAIL_SETUP.md for setup instructions',
  });
}
