"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { createCsvUploadRecord } from "@/lib/actions/upload-actions"
import { toast } from "sonner"
import { Loader2, Upload, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/supabase-client"
import { Progress } from "@/components/ui/progress"
import { TrainModelButton } from "./train-model-button"
import { motion, AnimatePresence } from "framer-motion"
import { useMainStore } from "../lib/store"

interface CsvUploadProps {
    projectId: string;
}

type UploadStatus = 'idle' | 'uploading' | 'uploaded' | 'preprocessing' | 'preprocessed' | 'training' | 'complete';

export function CsvUpload({ projectId }: CsvUploadProps) {
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
    const [uploadProgress, setUploadProgress] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const progressInterval = useRef<number | undefined>(undefined)
    const { addCsvUpload, updateCsvUpload } = useMainStore()
    const [currentUploadId, setCurrentUploadId] = useState<string | null>(null)

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
                return prev + 5 // Slower progress
            })
        }, 200) // Faster updates
    }

    const handleTrainingComplete = () => {
        setUploadStatus('complete')
        setTimeout(() => {
            setUploadStatus('idle')
            setUploadProgress(0)
            setCurrentUploadId(null)
        }, 2000)
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
            setUploadStatus('uploading')
            setUploadProgress(0)
            toast.info('Uploading CSV file...')
            
            const supabase = createClient()
            
            // Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            if (userError || !user) {
                throw new Error('Authentication required')
            }

            // Create user-specific path
            const filePath = `${user.id}/${Date.now()}-${file.name}`
            
            simulateProgress()

            // Create database record with UPLOADING status
            const { success, csvUpload, error: dbError } = await createCsvUploadRecord(filePath, projectId)
            
            if (!success || dbError || !csvUpload) {
                throw new Error(dbError || 'Failed to create database record')
            }

            // Add the new upload to the store with UPLOADING status
            addCsvUpload(projectId, {
                ...csvUpload,
                status: 'UPLOADING',
                results: []
            });

            // Upload file to Supabase Storage
            const { data, error } = await supabase.storage
                .from('csv-default-uploads')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                })

            if (error) throw error
            if (!data?.path) throw new Error('Upload failed - no path returned')

            // Clear progress simulation
            if (progressInterval.current) {
                clearInterval(progressInterval.current)
            }
            setUploadProgress(100)
            setUploadStatus('uploaded')
            toast.success('File uploaded successfully')
            
            // Update to PROCESSING status
            updateCsvUpload(projectId, csvUpload.id, { status: 'PROCESSING' });
            
            // Preprocessing step
            toast.info('Preprocessing data...')
            setUploadStatus('preprocessing')

            setCurrentUploadId(csvUpload.id)
            setUploadStatus('preprocessed')
            toast.success('Data preprocessing complete')
            
            // Start training
            setUploadStatus('training')
            toast.info('Starting model training...')

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        } catch (error) {
            // Clear progress simulation
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
            case 'uploading':
                return `Uploading... ${uploadProgress}%`
            case 'uploaded':
                return 'Upload Complete!'
            case 'preprocessing':
                return 'Preprocessing Data...'
            case 'preprocessed':
                return 'Preprocessing Complete!'
            case 'training':
                return 'Training Model...'
            case 'complete':
                return 'All Done!'
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
            
            <AnimatePresence>
                {uploadStatus !== 'idle' && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4 bg-accent/50 p-4 rounded-lg"
                    >
                        <div className="w-full max-w-sm space-y-2">
                            <Progress value={uploadProgress} className="h-2" />
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    {uploadStatus === 'uploading' && <Loader2 className="h-4 w-4 animate-spin" />}
                                    <p className="font-medium">{getStatusText()}</p>
                                </div>
                                {(uploadStatus === 'uploaded' || uploadStatus === 'preprocessed' || uploadStatus === 'complete') && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="text-green-500"
                                    >
                                        <CheckCircle className="h-5 w-5" />
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {uploadStatus === 'training' && currentUploadId && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <TrainModelButton 
                                    csv_upload_id={currentUploadId}
                                    projectId={projectId}
                                    autoStart={true}
                                    onTrainingComplete={handleTrainingComplete}
                                />
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
} 