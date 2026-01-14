import Stripe from "stripe";

// Lazy initialization to avoid build-time errors
let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
      typescript: true,
    });
  }
  return stripeClient;
}

// For backwards compatibility
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// Platform fee percentage (20%)
export const PLATFORM_FEE_PERCENT = 20;

// Calculate fees
export function calculateFees(totalAmount: number) {
  const platformFee = Math.round(totalAmount * (PLATFORM_FEE_PERCENT / 100));
  const cleanerPayout = totalAmount - platformFee;
  return { platformFee, cleanerPayout };
}
