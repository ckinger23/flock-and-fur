import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import { sendEmail, paymentProcessedEmail, BASE_URL } from "@/lib/email";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const jobId = session.metadata?.jobId;

        if (jobId) {
          // Update job status to PAID
          const job = await db.job.update({
            where: { id: jobId },
            data: {
              status: "PAID",
              paidAt: new Date(),
              stripePaymentIntentId: session.payment_intent as string,
            },
            include: {
              cleaner: { select: { name: true, email: true } },
            },
          });

          console.log(`Job ${jobId} marked as PAID`);

          // Send payment notification to cleaner
          if (job.cleaner?.email) {
            const emailData = paymentProcessedEmail({
              cleanerName: job.cleaner.name || "there",
              jobTitle: job.title,
              cleanerPayout: Number(job.cleanerPayout) || 0,
              jobUrl: `${BASE_URL}/cleaner/jobs/${jobId}`,
            });
            await sendEmail({ to: job.cleaner.email, ...emailData });
          }
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const userId = account.metadata?.userId;

        if (userId) {
          const onboarded = account.charges_enabled && account.payouts_enabled;

          await db.cleanerProfile.updateMany({
            where: { stripeAccountId: account.id },
            data: { stripeOnboarded: onboarded },
          });

          console.log(`Cleaner ${userId} Stripe onboarding status: ${onboarded}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
