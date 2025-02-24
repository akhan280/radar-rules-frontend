import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const signature = (await headers()).get("Stripe-Signature") as string;

        let event: Stripe.Event;

        try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err) {
        return new NextResponse(
            `Webhook Error: ${
            err instanceof Error ? err.message : "Unknown Error"
            }`,
            { status: 400 }
        );
        }

        const session = event.data.object as Stripe.Checkout.Session;

        if (event.type === "checkout.session.completed") {
        // Update user's payment status
        const userId = session.metadata?.userId;

        if (!userId) {
            return new NextResponse("No user ID in session metadata", {
            status: 400,
            });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { isPaid: true },
        });
        }

        return new NextResponse(null, { status: 200 });
    } catch (error) {
        console.error("Error handling webhook:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
    }
