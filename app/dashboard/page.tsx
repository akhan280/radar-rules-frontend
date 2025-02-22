"use client"

import { getAllProjects, createProject, updateProject, deleteProject } from "@/lib/actions/project-actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react"
import { Project } from "@prisma/client"
import { useState, useEffect } from "react"

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [success, setSuccess] = useState(true);

    useEffect(() => {
        getAllProjects().then(({ projects, success }) => {
            setProjects(projects);
            setSuccess(success);
        });
    }, []);

    if (!success) {
        return <div>Failed to load projects</div>
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Projects</h1>
                <CreateProjectForm />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
            </div>
        </div>
    )
}

function CreateProjectForm() {
    return (
        <form 
            action={async (formData: FormData) => {
                const name = formData.get('name') as string
                const description = formData.get('description') as string
                await createProject(name, description)
            }}
            className="flex gap-2"
        >
            <Input
                name="name"
                placeholder="Project name"
                required
                className="w-48"
            />
            <Input
                name="description"
                placeholder="Description"
                className="w-48"
            />
            <Button type="submit">
                <PlusIcon className="mr-2 h-4 w-4" />
                Create
            </Button>
        </form>
    )
}

function ProjectCard({ project }: { project: Project }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{project.name}</CardTitle>
                        <CardDescription>{project.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <EditProjectForm project={project} />
                        <form
                            action={async () => {
                                await deleteProject(project.id)
                            }}
                        >
                            <Button variant="destructive" size="icon">
                                <TrashIcon className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            </CardHeader>
        </Card>
    )
}

function EditProjectForm({ project }: { project: Project }) {
    return (
        <form
            action={async (formData: FormData) => {
                const name = formData.get('name') as string
                const description = formData.get('description') as string
                await updateProject(project.id, name, description)
            }}
        >
            <Button variant="outline" size="icon">
                <PencilIcon className="h-4 w-4" />
            </Button>
        </form>
    )
}