"use server"

import { createClient } from "../supabase/supabase-server"
import { prisma } from "../prisma"
import { getAuthenticatedUser } from "./actions"
import { CsvUpload } from "@prisma/client"

interface CsvUploadResponse {
    success: boolean;
    error?: string;
    csvUpload?: CsvUpload;
}

export async function createCsvUploadRecord(csvPath: string, projectId: string): Promise<CsvUploadResponse> {
    const user = await getAuthenticatedUser()
    
    if (!user) {
        return { success: false, error: "Not authenticated" }
    }

    try {
        const csvUpload = await prisma.csvUpload.create({
            data: {
                userId: user.id,
                projectId: projectId,
                csvPath: csvPath,
                status: "PROCESSING", // Initial status
            }
        })

        return { success: true, csvUpload }
    } catch (error) {
        console.error("Error creating CSV upload record:", error)
        return { success: false, error: "Failed to create CSV upload record" }
    }
}

export async function updateUploadStatus(uploadId: string, status: string): Promise<CsvUploadResponse> {
    const user = await getAuthenticatedUser()
    
    if (!user) {
        return { success: false, error: "Not authenticated" }
    }

    try {
        const csvUpload = await prisma.csvUpload.update({
            where: {
                id: uploadId,
                userId: user.id // Ensure user owns this upload
            },
            data: {
                status: status
            }
        })

        return { success: true, csvUpload }
    } catch (error) {
        console.error("Error updating CSV upload status:", error)
        return { success: false, error: "Failed to update CSV upload status" }
    }
}

export async function deleteUpload(uploadId: string): Promise<{ success: boolean; error?: string }> {
    const user = await getAuthenticatedUser()
    
    if (!user) {
        return { success: false, error: "Not authenticated" }
    }

    try {
        await prisma.csvUpload.delete({
            where: {
                id: uploadId,
                userId: user.id // Ensure user owns this upload
            }
        })

        return { success: true }
    } catch (error) {
        console.error("Error deleting CSV upload:", error)
        return { success: false, error: "Failed to delete CSV upload" }
    }
}

