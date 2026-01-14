import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

// Create a Stripe Connect account for a cleaner
export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "CLEANER") {
      return NextResponse.json(
        { error: "Only cleaners can connect Stripe" },
        { status: 403 }
      );
    }

    // Check if cleaner already has a Stripe account
    const profile = await db.cleanerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Cleaner profile not found" },
        { status: 404 }
      );
    }

    let accountId = profile.stripeAccountId;

    // Create a new Stripe Connect account if one doesn't exist
    if (!accountId) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
      });

      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: user?.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: {
          userId: session.user.id,
        },
      });

      accountId = account.id;

      // Save the account ID
      await db.cleanerProfile.update({
        where: { userId: session.user.id },
        data: { stripeAccountId: accountId },
      });
    }

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXTAUTH_URL}/cleaner/profile?stripe=refresh`,
      return_url: `${process.env.NEXTAUTH_URL}/cleaner/profile?stripe=success`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error("Stripe Connect error:", error);
    return NextResponse.json(
      { error: "Failed to create Stripe account" },
      { status: 500 }
    );
  }
}

// Check Stripe account status
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.cleanerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile?.stripeAccountId) {
      return NextResponse.json({
        connected: false,
        onboarded: false,
      });
    }

    // Check account status
    const account = await stripe.accounts.retrieve(profile.stripeAccountId);

    const onboarded = account.charges_enabled && account.payouts_enabled;

    // Update profile if onboarding status changed
    if (onboarded !== profile.stripeOnboarded) {
      await db.cleanerProfile.update({
        where: { userId: session.user.id },
        data: { stripeOnboarded: onboarded },
      });
    }

    return NextResponse.json({
      connected: true,
      onboarded,
      accountId: profile.stripeAccountId,
    });
  } catch (error) {
    console.error("Stripe status check error:", error);
    return NextResponse.json(
      { error: "Failed to check Stripe status" },
      { status: 500 }
    );
  }
}
