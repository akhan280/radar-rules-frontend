"use server"

import { Project } from "@prisma/client";
import { getAuthenticatedUser } from "./actions";
import prisma from "../db";


export async function getAllProjects(): Promise<{projects: Project[], success: boolean}> {
    const user = await getAuthenticatedUser()
    
    try {
        const projects = await prisma.project.findMany({
            where: {
                userId: user.id
            }
        })

        return {
            projects,
            success: true
        }
    } catch (error) {
        return {
            projects: [],
            success: false
        }
    }
}

export async function createProject(
    name: string,
    description: string | null
): Promise<{success: boolean; message: string; project?: Project}> {
    const user = await getAuthenticatedUser();
    
    try {
        const project = await prisma.project.create({
            data: {
                name,
                description,
                userId: user.id
            }
        });

        return {
            success: true,
            message: "Project created successfully",
            project
        };
    } catch (error) {
        return {
            success: false,
            message: "Failed to create project"
        };
    }
}

export async function updateProject(
    projectId: number,
    name: string,
    description: string | null
): Promise<{success: boolean; message: string}> {
    const user = await getAuthenticatedUser();
    
    try {
        await prisma.project.updateMany({
            where: {
                id: projectId,
                userId: user.id
            },
            data: {
                name,
                description
            }
        });

        return {
            success: true,
            message: "Project updated successfully"
        };
    } catch (error) {
        return {
            success: false,
            message: "Failed to update project"
        };
    }
}

export async function deleteProject(
    projectId: number
): Promise<{success: boolean; message: string}> {
    const user = await getAuthenticatedUser();
    
    try {
        await prisma.project.deleteMany({
            where: {
                id: projectId,
                userId: user.id 
            }
        });

        return {
            success: true,
            message: "Project deleted successfully"
        };
    } catch (error) {
        return {
            success: false,
            message: "Failed to delete project"
        };
    }
}