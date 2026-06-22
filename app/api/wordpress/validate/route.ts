import { NextRequest, NextResponse } from "next/server";
import { validateCredentials, type WordPressCredentials } from "@/lib/wordpress/service";
import { withErrorHandler, assertValid } from "@/lib/error-handler";
import { authenticateRequest, validateRequestBody } from "@/lib/api-security";
import { checkRateLimitByIdentifier } from "@/lib/rate-limit";
import { validateWordPressCredentials } from "@/lib/validation";

export const POST = withErrorHandler(async (request: NextRequest) => {
  // 1. Authenticate
  const auth = await authenticateRequest(request);
  assertValid(auth.success, auth.error || "Authentication failed");
  const uid = auth.uid!;

  // 2. Rate limit (30 req/min for WordPress operations)
  const rateLimit = await checkRateLimitByIdentifier(uid, 30, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { 
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) }
      }
    );
  }

  // 3. Validate request body
  const body = await request.json();
  const validation = validateRequestBody(body, ["siteUrl", "username", "password"]);
  assertValid(validation.valid, validation.error || "Invalid request");

  const { siteUrl, username, password } = body as WordPressCredentials;

  // 4. Validate WordPress credentials format
  const credValidation = validateWordPressCredentials({ siteUrl, username, password });
  assertValid(credValidation.valid, credValidation.error || "Invalid credentials format");

  // 5. Validate credentials with WordPress
  const result = await validateCredentials({ siteUrl, username, password });

  if (!result.valid) {
    return NextResponse.json(
      { error: result.error || "Invalid credentials" },
      { status: 400 }
    );
  }

  // 6. Return success
  return NextResponse.json({
    valid: true,
    siteName: result.siteName,
  });
});