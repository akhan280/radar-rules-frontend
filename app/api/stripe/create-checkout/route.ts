import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getAuthenticatedUser } from "../../../../lib/actions/actions"
import { prisma } from "@/lib/prisma"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const QUARTERLY_PRICE_ID = process.env.STRIPE_QUARTERLY_PRICE_ID!

export async function POST() {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        // Get the full user from DB (with stripeCustomerId)
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
        })
        if (!dbUser) {
            return new NextResponse("User not found in DB", { status: 404 })
        }

        let stripeCustomerId = dbUser.stripeCustomerId

        // If no stripeCustomerId, create Stripe customer and save
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: dbUser.email,
                name: [dbUser.firstName, dbUser.lastName].filter(Boolean).join(" ") || undefined,
                metadata: {
                    userId: dbUser.id,
                },
            })
            stripeCustomerId = customer.id
            await prisma.user.update({
                where: { id: dbUser.id },
                data: { stripeCustomerId },
            })
        }

        const checkoutSession = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [
                {
                    price: QUARTERLY_PRICE_ID,
                    quantity: 1,
                },
            ],
            customer: stripeCustomerId,
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?canceled=true`,
            metadata: {
                userId: user.id,
                email: user.email,
            },
        })

        return NextResponse.json({ url: checkoutSession.url })
    } catch (error) {
        console.error("Error creating checkout session:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}