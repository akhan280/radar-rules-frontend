"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, PlusIcon } from "lucide-react"
import { useState } from "react"
import { useProjectActions } from "@/lib/store"

export function CreateProjectForm() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { addProject } = useProjectActions()

    async function handleSubmit(formData: FormData) {
        try {
            setIsLoading(true)
            const name = formData.get('name') as string
            const description = formData.get('description') as string
            const { success } = await addProject(name, description)
            
            if (success) {
                setOpen(false)
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleDialogClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <Dialog 
            open={open} 
            onOpenChange={(open) => {
                setOpen(open);
                if (!open) {
                    handleDialogClick({ preventDefault: () => {}, stopPropagation: () => {} } as React.MouseEvent);
                }
            }}
        >
            <DialogTrigger asChild onClick={handleDialogClick}>
                <Button>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create Project
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" onClick={handleDialogClick}>
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                        Create a new project to organize your rules and configurations.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4" onClick={handleDialogClick}>
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">
                            Project Name
                        </label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Enter project name"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium">
                            Description
                        </label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Enter project description"
                            className="h-32"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Project'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
} 