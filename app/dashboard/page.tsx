"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { MoreVertical, PencilIcon, TrashIcon } from "lucide-react"
import { Project } from "@prisma/client"
import { useEffect } from "react"
import { CreateProjectForm } from "@/components/create-project-form"
import { EditProjectForm } from "@/components/edit-project-form"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useProjects, useProjectActions } from '@/lib/store'

export default function ProjectsPage() {
    const { projects, isLoading, error } = useProjects()
    const { fetchProjects } = useProjectActions()

    useEffect(() => {
        fetchProjects()
    }, [fetchProjects])

    if (error) {
        return <div>Failed to load projects: {error}</div>
    }

    if (isLoading) {
        return <div>Loading projects...</div>
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Projects</h1>
                <CreateProjectForm />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                    <ProjectCard 
                        key={project.id} 
                        project={project}
                    />
                ))}
            </div>
        </div>
    )
}

interface ProjectCardProps {
    project: Project;
}

function ProjectCard({ project }: ProjectCardProps) {
    const { removeProject } = useProjectActions()

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        await removeProject(project.id);
    };

    const handleDropdownClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <Link href={`/dashboard/${project.id}`} className="block">
            <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>{project.name}</CardTitle>
                            <CardDescription>{project.description}</CardDescription>
                        </div>
                        <div className="relative" onClick={handleDropdownClick}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={handleDropdownClick}>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" onClick={handleDropdownClick}>
                                    <EditProjectForm
                                        project={project}
                                        trigger={
                                            <DropdownMenuItem onSelect={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}>
                                                <PencilIcon className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                        }
                                    />
                                    <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={handleDelete}
                                    >
                                        <TrashIcon className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>
            </Card>
        </Link>
    )
}