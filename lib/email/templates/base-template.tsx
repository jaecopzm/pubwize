/**
 * Base Email Template
 * Mobile-optimized responsive HTML email template with Pubwize branding
 */

interface BaseTemplateProps {
  previewText?: string;
  children: React.ReactNode;
  unsubscribeUrl?: string;
}

export function BaseTemplate({ previewText, children }: BaseTemplateProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        {previewText && (
          <div
            style={{
              display: 'none',
              maxHeight: 0,
              overflow: 'hidden',
              fontSize: 1,
              lineHeight: 1,
              color: '#ffffff',
            }}
          >
            {previewText}
          </div>
        )}
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#f5f5f5',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        {/* Wrapper */}
        <table
          role="presentation"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: '#f5f5f5',
          }}
        >
          <tr>
            <td align="center" style={{ padding: '40px 20px' }}>
              {/* Container */}
              <table
                role="presentation"
                style={{
                  maxWidth: '600px',
                  width: '100%',
                  borderCollapse: 'collapse',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
              >
                {/* Header */}
                <tr>
                  <td
                    style={{
                      background: 'linear-gradient(135deg, #D4AF37 0%, #14B8A6 100%)',
                      padding: '32px 24px',
                      textAlign: 'center',
                    }}
                  >
                    <h1
                      style={{
                        margin: 0,
                        color: '#ffffff',
                        fontSize: '28px',
                        fontWeight: 'bold',
                        letterSpacing: '-0.5px',
                      }}
                    >
                      Pubwize
                    </h1>
                  </td>
                </tr>

                {/* Content */}
                <tr>
                  <td style={{ padding: '32px 24px' }}>{children}</td>
                </tr>

                {/* Footer */}
                <tr>
                  <td
                    style={{
                      padding: '24px',
                      backgroundColor: '#f9fafb',
                      borderTop: '1px solid #e5e7eb',
                    }}
                  >
                    <table role="presentation" style={{ width: '100%' }}>
                      <tr>
                        <td style={{ textAlign: 'center' }}>
                          <p
                            style={{
                              margin: '0 0 12px 0',
                              fontSize: '14px',
                              color: '#6b7280',
                            }}
                          >
                            Have questions? Just reply to this email - we read every message!
                          </p>
                          <p
                            style={{
                              margin: '0 0 12px 0',
                              fontSize: '14px',
                              color: '#6b7280',
                            }}
                          >
                            © {new Date().getFullYear()} Pubwize. All rights reserved.
                          </p>
                          <p
                            style={{
                              margin: '0 0 12px 0',
                              fontSize: '12px',
                              color: '#9ca3af',
                            }}
                          >
                            AI-Powered SEO Content Platform
                          </p>
                          <p style={{ margin: 0, fontSize: '12px' }}>
                            <a
                              href="https://pubwize.com"
                              style={{ color: '#D4AF37', textDecoration: 'none' }}
                            >
                              Visit Website
                            </a>
                            {' • '}
                            <a
                              href="https://pubwize.com/dashboard/settings"
                              style={{ color: '#D4AF37', textDecoration: 'none' }}
                            >
                              Settings
                            </a>
                            {' • '}
                            <a
                              href="https://pubwize.com/contact"
                              style={{ color: '#D4AF37', textDecoration: 'none' }}
                            >
                              Support
                            </a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}

// Button component
export function Button({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <table role="presentation" style={{ margin: '24px 0' }}>
      <tr>
        <td align="center">
          <a
            href={href}
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #D4AF37 0%, #14B8A6 100%)',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}
          >
            {children}
          </a>
        </td>
      </tr>
    </table>
  );
}

// Heading component
export function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        margin: '0 0 16px 0',
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#111827',
        lineHeight: '1.3',
      }}
    >
      {children}
    </h2>
  );
}

// Paragraph component
export function Paragraph({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p
      style={{
        margin: '0 0 16px 0',
        fontSize: '16px',
        color: '#4b5563',
        lineHeight: '1.6',
        ...style,
      }}
    >
      {children}
    </p>
  );
}

// Divider component
export function Divider() {
  return (
    <hr
      style={{
        margin: '24px 0',
        border: 'none',
        borderTop: '1px solid #e5e7eb',
      }}
    />
  );
}

// Info Box component
export function InfoBox({
  title,
  children,
  type = 'info',
}: {
  title?: string;
  children: React.ReactNode;
  type?: 'info' | 'success' | 'warning' | 'error';
}) {
  const colors = {
    info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
    success: { bg: '#f0fdf4', border: '#10b981', text: '#065f46' },
    warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
    error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
  };

  const color = colors[type];

  return (
    <table
      role="presentation"
      style={{
        width: '100%',
        margin: '16px 0',
        backgroundColor: color.bg,
        border: `2px solid ${color.border}`,
        borderRadius: '8px',
      }}
    >
      <tr>
        <td style={{ padding: '16px' }}>
          {title && (
            <p
              style={{
                margin: '0 0 8px 0',
                fontSize: '14px',
                fontWeight: 'bold',
                color: color.text,
              }}
            >
              {title}
            </p>
          )}
          <div style={{ fontSize: '14px', color: color.text }}>{children}</div>
        </td>
      </tr>
    </table>
  );
}
