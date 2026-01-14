import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, PLATFORM_FEE_PERCENT } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    // Get the job
    const job = await db.job.findUnique({
      where: { id: jobId },
      include: {
        cleaner: {
          include: {
            cleanerProfile: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify ownership
    if (job.clientId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Check job status - must be CONFIRMED to pay
    if (job.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "Job must be confirmed before payment" },
        { status: 400 }
      );
    }

    // Verify cleaner has Stripe connected
    if (!job.cleaner?.cleanerProfile?.stripeAccountId) {
      return NextResponse.json(
        { error: "Cleaner has not connected their payment account" },
        { status: 400 }
      );
    }

    if (!job.cleaner.cleanerProfile.stripeOnboarded) {
      return NextResponse.json(
        { error: "Cleaner has not completed payment setup" },
        { status: 400 }
      );
    }

    if (!job.agreedPrice) {
      return NextResponse.json(
        { error: "Job price not set" },
        { status: 400 }
      );
    }

    const amount = Math.round(Number(job.agreedPrice) * 100); // Convert to cents
    const applicationFee = Math.round(amount * (PLATFORM_FEE_PERCENT / 100));

    // Create a Checkout Session with destination charge
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Cleanup Service: ${job.title}`,
              description: `Service by ${job.cleaner.name}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFee,
        transfer_data: {
          destination: job.cleaner.cleanerProfile.stripeAccountId,
        },
        metadata: {
          jobId: job.id,
          clientId: job.clientId,
          cleanerId: job.cleanerId || "",
        },
      },
      success_url: `${process.env.NEXTAUTH_URL}/client/jobs/${job.id}?payment=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/client/jobs/${job.id}?payment=cancelled`,
      metadata: {
        jobId: job.id,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
