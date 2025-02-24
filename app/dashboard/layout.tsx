import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "../../components/app-sidebar"
import { OnboardingModal } from "@/components/onboarding-modal"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "../../lib/actions/actions"

export default async function HomeLayout({children}: {children: React.ReactNode}) {
    const user = await getAuthenticatedUser()   

    if (!user) {
        redirect("/auth/signin")
    }

    const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
    })

    if (!fullUser?.isPaid) {
        redirect("/checkout")
    }

    return (
        <div className="p-14">
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    {!fullUser?.hasCompletedOnboarding && <OnboardingModal />}
                    {children}
                </SidebarInset>
            </SidebarProvider>
        </div>
    )
}
