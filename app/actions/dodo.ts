"use server";

import DodoPayments from "dodopayments";
import { getDodoEnv } from "@/lib/dodo";

export async function createDodoCheckoutSession(params: {
  priceId: string;
  quantity?: number;
  customerEmail?: string;
  userId?: string;
  passthrough?: string;
}) {
  try {
    const apiKey = process.env.DODO_API_KEY;

    if (!apiKey) {
      throw new Error("Missing DODO_API_KEY");
    }

    const env = getDodoEnv();
    const mode = env === "sandbox" ? "test_mode" : "live_mode";

    console.log("[Dodo] Creating checkout", {
      env,
      mode,
      priceId: params.priceId,
    });

    const client = new DodoPayments({
      bearerToken: apiKey,
      environment: mode,
    });

    const metadata: Record<string, string> = {};

    if (params.userId) metadata.userId = params.userId;
    if (params.passthrough) metadata.passthrough = params.passthrough;

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const returnUrl =
      `${appUrl}/dashboard/settings?tab=billing&success=true`;

    const session = await client.checkoutSessions.create({
      product_cart: [
        {
          product_id: params.priceId,
          quantity: params.quantity || 1,
        },
      ],

      customer: params.customerEmail
        ? { email: params.customerEmail }
        : undefined,

      metadata:
        Object.keys(metadata).length > 0 ? metadata : undefined,

      return_url: returnUrl,
      cancel_url: `${appUrl}/dashboard/settings?tab=billing&canceled=true`,
      feature_flags: {
        redirect_immediately: true,
      },
    } as any);

    console.log("[Dodo] Checkout created", session.session_id);

    return {
      success: true,
      url: session.checkout_url,
      sessionId: session.session_id,
    };
  } catch (error: any) {
    console.error("Dodo checkout error:", error);

    const errorMessage = error?.message || "Failed to create checkout session";
    const errorCode = error?.status || error?.code || "UNKNOWN_ERROR";

    return {
      success: false,
      error: errorMessage,
      code: errorCode,
    };
  }
}

export async function createDodoCustomerPortalSession(customerId: string) {
  try {
    const apiKey = process.env.DODO_API_KEY;

    if (!apiKey) {
      throw new Error("Missing DODO_API_KEY");
    }

    const env = getDodoEnv();
    const mode = env === "sandbox" ? "test_mode" : "live_mode";

    const client = new DodoPayments({
      bearerToken: apiKey,
      environment: mode,
    });

    const session = await client.customers.customerPortal.create(customerId);

    return {
      success: true,
      url: session.link,
    };
  } catch (error: any) {
    console.error("Dodo customer portal error:", error);

    return {
      success: false,
      error: error?.message || "Failed to create customer portal session",
    };
  }
}