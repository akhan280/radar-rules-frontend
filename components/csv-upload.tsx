"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { createCsvUploadRecord } from "@/lib/actions/upload-actions"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"
import { createClient } from "@/lib/supabase/supabase-client"
import { Progress } from "@/components/ui/progress"

interface CsvUploadProps {
    projectId?: string;
}

type UploadStatus = 'idle' | 'preparing' | 'uploading' | 'processing' | 'complete';

export function CsvUpload({ projectId }: CsvUploadProps) {
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
    const [uploadProgress, setUploadProgress] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const progressInterval = useRef<number | undefined>(undefined)

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (progressInterval.current) {
                clearInterval(progressInterval.current)
            }
        }
    }, [])

    const simulateProgress = () => {
        setUploadProgress(0)
        progressInterval.current = window.setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) {
                    if (progressInterval.current) {
                        clearInterval(progressInterval.current)
                    }
                    return 90
                }
                return prev + 10
            })
        }, 500)
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.name.endsWith('.csv')) {
            toast.error('Please select a CSV file')
            return
        }

        try {
            setUploadStatus('preparing')
            setUploadProgress(0)
            
            const supabase = createClient()
            
            // Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            if (userError || !user) {
                throw new Error('Authentication required')
            }

            // Create user-specific path
            const filePath = `${user.id}/csv/${Date.now()}-${file.name}`
            
            setUploadStatus('uploading')
            simulateProgress()

            // Upload file to Supabase Storage in user's folder
            const { data, error } = await supabase.storage
                .from('csv-default-uploads')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true // Allow overwriting in user's own directory
                })

            if (error) {
                throw error
            }

            if (!data?.path) {
                throw new Error('Upload failed - no path returned')
            }

            // Clear progress simulation
            if (progressInterval.current) {
                clearInterval(progressInterval.current)
            }
            setUploadProgress(100)
            
            setUploadStatus('processing')
            // Create database record
            const { success, csvUpload, error: dbError } = await createCsvUploadRecord(data.path, projectId)
            
            if (!success || dbError || !csvUpload) {
                throw new Error(dbError || 'Failed to create database record')
            }

            // Call preprocessing Lambda
            const preprocessResponse = await fetch('/api/data-preprocessing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    csvUploadId: csvUpload.id
                })
            })

            if (!preprocessResponse.ok) {
                const errorData = await preprocessResponse.json()
                throw new Error(errorData.message || 'Failed to process CSV file')
            }

            setUploadStatus('complete')
            toast.success('CSV file uploaded and processed successfully')
            
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }

            // Reset status after a delay
            setTimeout(() => {
                setUploadStatus('idle')
                setUploadProgress(0)
            }, 2000)
        } catch (error) {
            // Clear progress simulation on error
            if (progressInterval.current) {
                clearInterval(progressInterval.current)
            }
            console.error('Upload error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to upload file')
            setUploadStatus('idle')
            setUploadProgress(0)
        }
    }

    const getStatusText = () => {
        switch (uploadStatus) {
            case 'preparing':
                return 'Preparing upload...'
            case 'uploading':
                return `Uploading... ${uploadProgress}%`
            case 'processing':
                return 'Processing data...'
            case 'complete':
                return 'Upload complete!'
            default:
                return 'Upload CSV'
        }
    }

    const isLoading = uploadStatus !== 'idle' && uploadStatus !== 'complete'

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={isLoading}
                    className="max-w-sm"
                />
                <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {getStatusText()}
                        </>
                    ) : (
                        <>
                            <Upload className="mr-2 h-4 w-4" />
                            {getStatusText()}
                        </>
                    )}
                </Button>
            </div>
            
            {uploadStatus !== 'idle' && (
                <div className="w-full max-w-sm space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-sm text-muted-foreground text-center">
                        {getStatusText()}
                    </p>
                </div>
            )}
        </div>
    )
} 