"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function CheckoutPage() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleCheckout = async () => {
        try {
            setIsLoading(true)
            const response = await fetch("/api/stripe/create-checkout", {
                method: "POST",
            })

            if (!response.ok) {
                throw new Error("Failed to create checkout session")
            }

            const { url } = await response.json()
            router.push(url)
        } catch (error) {
            console.error("Error creating checkout session:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24">
            <div className="max-w-2xl text-center">
                <h1 className="text-4xl font-bold tracking-tight">
                    Upgrade to Radar Rules Pro
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                    Get access to advanced fraud detection features, unlimited projects, and priority support.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                    <Button
                        onClick={handleCheckout}
                        disabled={isLoading}
                    >
                        {isLoading ? "Loading..." : "Subscribe Now - $99/quarter"}
                    </Button>
                </div>
            </div>
        </div>
    )
} 