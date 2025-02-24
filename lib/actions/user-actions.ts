"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getAuthenticatedUser } from "./actions"

export async function completeOnboarding() {
    const user = await getAuthenticatedUser()    
    if (!user) {
        throw new Error("Unauthorized")
    }

    const fulluser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true }
    })

    if (!user) {
        throw new Error("User not found")
    }

    await prisma.user.update({
        where: { id: user.id },
        data: { hasCompletedOnboarding: true }
    })

    revalidatePath("/dashboard")
} 