"use client"
import { useState, useEffect } from 'react'
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileIcon, AlertCircle, CheckCircle, ArrowRight, RefreshCw, Trash2 } from "lucide-react"
import { ExtendedCsvUpload } from '@/lib/store/project-slice'
import { formatDistanceToNow } from 'date-fns'
import RulesView from './rules-view'
import { TrainModelButton } from './train-model-button'
import { deleteUpload } from '@/lib/actions/upload-actions'
import { toast } from 'sonner'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface CsvUploadsViewProps {
    uploads: ExtendedCsvUpload[];
    projectId: string;
}

export function CsvUploadsView({ uploads, projectId }: CsvUploadsViewProps) {
    const [selectedUpload, setSelectedUpload] = useState<string | null>(null)
    const [retrainingId, setRetrainingId] = useState<string | null>(null)

    const getStatusIcon = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'PROCESSING':
                return <AlertCircle className="h-4 w-4 text-yellow-500" />
            case 'FAILED':
                return <AlertCircle className="h-4 w-4 text-red-500" />
            case 'COMPLETED':
                return <CheckCircle className="h-4 w-4 text-green-500" />
            default:
                return <FileIcon className="h-4 w-4 text-gray-500" />
        }
    }

    const getStatusText = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'PROCESSING':
                return 'Processing'
            case 'FAILED':
                return 'Failed'
            case 'COMPLETED':
                return 'Completed'
            default:
                return 'Unknown'
        }
    }

    const handleRetrainingComplete = () => {
        setRetrainingId(null)
    }

    const handleDelete = async (uploadId: string) => {
        try {
            const result = await deleteUpload(uploadId)
            if (result.success) {
                toast.success('Upload deleted successfully')
                // Refresh the page to update the list
                window.location.reload()
            } else {
                throw new Error(result.error)
            }
        } catch (error) {
            toast.error('Failed to delete upload')
            console.error('Delete error:', error)
        }
    }

    // Get the selected upload's details
    const activeUpload = uploads.find(u => u.id === selectedUpload)

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left sidebar with uploads list */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-xl font-semibold">CSV Uploads</h2>
                    {uploads.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-center text-muted-foreground">No uploads yet. Upload a CSV file to get started.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {uploads.map((upload) => (
                                <Card 
                                    key={upload.id}
                                    className={`cursor-pointer transition-colors hover:bg-accent ${
                                        selectedUpload === upload.id ? 'border-primary' : ''
                                    }`}
                                    onClick={() => setSelectedUpload(upload.id)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                {getStatusIcon(upload.status)}
                                                <div>
                                                    <p className="font-medium">{upload.csvPath.split('/').pop()}</p>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <span>{formatDistanceToNow(new Date(upload.createdAt), { addSuffix: true })}</span>
                                                        <span>•</span>
                                                        <span className={
                                                            upload.status?.toUpperCase() === 'FAILED' ? 'text-red-500' :
                                                            upload.status?.toUpperCase() === 'PROCESSING' ? 'text-yellow-500' :
                                                            'text-muted-foreground'
                                                        }>
                                                            {getStatusText(upload.status)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {(upload.status?.toUpperCase() === 'FAILED' || upload.results.length > 0) && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setRetrainingId(upload.id);
                                                        }}
                                                    >
                                                        <RefreshCw className="h-4 w-4 mr-2" />
                                                        {upload.status?.toUpperCase() === 'FAILED' ? 'Retry' : 'Retrain'}
                                                    </Button>
                                                )}
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8"
                                                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Upload</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete this upload? This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                                                Cancel
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction 
                                                                onClick={(e: React.MouseEvent) => {
                                                                    e.stopPropagation();
                                                                    handleDelete(upload.id);
                                                                }}
                                                                className="bg-red-500 hover:bg-red-600"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                                {selectedUpload === upload.id && (
                                                    <ArrowRight className="h-4 w-4 text-primary" />
                                                )}
                                            </div>
                                        </div>
                                        {retrainingId === upload.id && (
                                            <div 
                                                className="mt-2" 
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <TrainModelButton 
                                                    csv_upload_id={upload.id}
                                                    projectId={projectId}
                                                    onTrainingComplete={handleRetrainingComplete}
                                                />
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right panel with detailed view */}
                <div className="lg:col-span-2">
                    {selectedUpload ? (
                        activeUpload?.results.length ? (
                            <RulesView 
                                csvUploadId={selectedUpload} 
                                key={selectedUpload} // Force refresh when selection changes
                            />
                        ) : (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <AlertCircle className={`h-8 w-8 mx-auto mb-4 ${
                                        activeUpload?.status?.toUpperCase() === 'FAILED' ? 'text-red-500' : 'text-yellow-500'
                                    }`} />
                                    <h3 className="text-lg font-semibold mb-2">
                                        {activeUpload?.status?.toUpperCase() === 'FAILED' ? 'Analysis Failed' : 'Analysis in Progress'}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {activeUpload?.status?.toUpperCase() === 'FAILED' 
                                            ? 'The fraud analysis failed. Please try retraining.'
                                            : 'The fraud analysis for this upload is still processing. Check back soon to see the results.'
                                        }
                                    </p>
                                </CardContent>
                            </Card>
                        )
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <FileIcon className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No Upload Selected</h3>
                                <p className="text-muted-foreground">
                                    Select a CSV upload from the left to view its analysis results.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
} 