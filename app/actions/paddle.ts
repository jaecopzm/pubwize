"use server";

import { getPaddleClient } from "@/lib/paddle";

export async function createPaddleCheckoutSession(params: {
  priceId: string;
  customerEmail?: string;
  userId?: string;
}) {
  try {
    // Return price ID for client-side Paddle.js checkout
    return {
      success: true,
      priceId: params.priceId,
      customerEmail: params.customerEmail,
      customData: params.userId ? { userId: params.userId } : undefined,
    };
  } catch (error: any) {
    console.error("Paddle checkout error:", error);
    return { success: false, error: error?.message || "Failed to create checkout session" };
  }
}

export async function createPaddleCustomerPortalSession(customerId: string, subscriptionId?: string) {
  try {
    const paddle = getPaddleClient();
    const authToken = await paddle.customers.generateAuthToken(customerId);
    const env = process.env.PADDLE_ENV === 'production' ? 'customer-portal' : 'sandbox-customer-portal';
    const portalUrl = `https://${env}.paddle.com/auth/${authToken.customerAuthToken}`;
    return { success: true, url: portalUrl };
  } catch (error: any) {
    console.error("Paddle customer portal error:", error);
    return { success: false, error: error?.message || "Failed to create customer portal session" };
  }
}
