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

export async function createCsvUploadRecord(csvPath: string, projectId?: string): Promise<CsvUploadResponse> {
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
                status: "UPLOADED", // Initial status
            }
        })

        return { success: true, csvUpload }
    } catch (error) {
        console.error("Error creating CSV upload record:", error)
        return { success: false, error: "Failed to create CSV upload record" }
    }
}

