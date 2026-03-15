"use client";

import { useState, useEffect } from "react";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { CreditCard, Download, Calendar, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { createDodoCustomerPortalSession } from "@/app/actions/dodo";

interface BillingManagementProps {
  customerId?: string;
  subscriptionId?: string;
  currentPlan: string;
  onCancelSuccess?: () => void;
}

export function BillingManagement({ 
  customerId, 
  subscriptionId, 
  currentPlan,
  onCancelSuccess 
}: BillingManagementProps) {
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (customerId) {
      fetchBillingData();
    } else {
      setLoading(false);
    }
  }, [customerId]);

  const fetchBillingData = async () => {
    try {
      const auth = getFirebaseAuth();
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;

      const [methodsRes, invoicesRes] = await Promise.all([
        fetch(`/api/billing/payment-methods?customerId=${customerId}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        }),
        fetch(`/api/billing/invoices?customerId=${customerId}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        }),
      ]);

      if (methodsRes.ok) {
        const data = await methodsRes.json();
        setPaymentMethods(data.paymentMethods || []);
      }

      if (invoicesRes.ok) {
        const data = await invoicesRes.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error("Failed to fetch billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentMethod = async () => {
    if (!customerId) return;

    try {
      const result = await createDodoCustomerPortalSession(customerId);
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        toast.error(result.error || "Failed to open payment portal");
      }
    } catch (error) {
      toast.error("Failed to update payment method");
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscriptionId) return;

    setCanceling(true);
    try {
      const auth = getFirebaseAuth();
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;

      const res = await fetch("/api/billing/cancel-subscription", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscriptionId }),
      });

      if (!res.ok) throw new Error("Failed to cancel");

      toast.success("Subscription canceled successfully");
      setShowCancelConfirm(false);
      onCancelSuccess?.();
    } catch (error) {
      toast.error("Failed to cancel subscription");
    } finally {
      setCanceling(false);
    }
  };

  if (!customerId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No active subscription</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Methods */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-gold" />
          Payment Methods
        </h3>
        
        {paymentMethods.length > 0 ? (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border bg-card"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {method.card?.brand?.toUpperCase()} •••• {method.card?.last4}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Expires {method.card?.exp_month}/{method.card?.exp_year}
                    </p>
                  </div>
                </div>
                {method.is_default && (
                  <span className="text-xs font-bold px-2 py-1 rounded bg-teal/10 text-teal">
                    DEFAULT
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No payment methods on file</p>
        )}

        <button
          onClick={handleUpdatePaymentMethod}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:border-gold/30 hover:text-gold transition-colors text-sm font-medium"
        >
          <ExternalLink className="h-4 w-4" />
          Update Payment Method
        </button>
      </div>

      {/* Billing History */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-teal" />
          Billing History
        </h3>

        {invoices.length > 0 ? (
          <div className="space-y-2">
            {invoices.slice(0, 5).map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-gold/20 transition-colors"
              >
                <div>
                  <p className="font-medium">
                    ${(invoice.amount_total / 100).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(invoice.created * 1000), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      invoice.status === 'paid'
                        ? 'bg-teal/10 text-teal'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {invoice.status?.toUpperCase()}
                  </span>
                  {invoice.invoice_pdf && (
                    <a
                      href={invoice.invoice_pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No billing history</p>
        )}
      </div>

      {/* Cancel Subscription */}
      {currentPlan !== 'free' && subscriptionId && (
        <div className="pt-6 border-t border-border">
          {!showCancelConfirm ? (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="flex items-center gap-2 text-sm text-destructive hover:underline"
            >
              <AlertCircle className="h-4 w-4" />
              Cancel Subscription
            </button>
          ) : (
            <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5">
              <p className="text-sm font-medium mb-4">
                Are you sure you want to cancel your subscription? You'll lose access to Pro features at the end of your billing period.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelSubscription}
                  disabled={canceling}
                  className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 text-sm font-medium"
                >
                  {canceling ? "Canceling..." : "Yes, Cancel"}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-sm font-medium"
                >
                  Keep Subscription
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
