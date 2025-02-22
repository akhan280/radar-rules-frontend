import { getAuthenticatedUser } from "../../../lib/actions/actions"
import { redirect } from 'next/navigation'
import { getProject } from "@/lib/actions/project-actions"
import { notFound } from "next/navigation"

interface ProjectLayoutProps {
    children: React.ReactNode;
    params: { project: string };
}

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
    const user = await getAuthenticatedUser()
    if (!user) {
        redirect('/auth/login')
    }

    const { project: projectId } = await params
    const { project, success } = await getProject(projectId)

    if (!success || !project) {
        notFound()
    }

    // Verify project ownership
    if (project.userId !== user.id) {
        redirect('/dashboard')
    }
    
    return (
        <div className="container mx-auto py-8">
            {children}
        </div>
    )
}