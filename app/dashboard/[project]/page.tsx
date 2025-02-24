
import { CsvUploadsView } from "@/components/csv-uploads-view"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { CsvUpload } from "../../../components/csv-upload-button"

export default async function Project({ params }: { params: { project: string } }) {
    const projectId = (await params).project

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            csvUploads: {
                include: {
                    results: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }
        }
    })

    if (!project) {
        notFound()
    }

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">{project.name}</h1>
                    {project.description && (
                        <p className="text-muted-foreground mt-2">{project.description}</p>
                    )}
                </div>
            </div>

            <div className="grid gap-8">
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Upload New CSV</h2>
                    <CsvUpload projectId={project.id} />
                </div>

                <CsvUploadsView uploads={project.csvUploads} projectId={project.id} />
            </div>
        </div>
    )
}