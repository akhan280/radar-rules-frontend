import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getAuthenticatedUser } from "../../../../lib/actions/actions"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const QUARTERLY_PRICE_ID = process.env.STRIPE_QUARTERLY_PRICE_ID!

export async function POST() {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
        return new NextResponse("Unauthorized", { status: 401 })
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