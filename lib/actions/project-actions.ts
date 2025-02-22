"use server"

import { Project } from "@prisma/client";
import { getAuthenticatedUser } from "./actions";
import prisma from "../db";

interface ProjectResponse {
    success: boolean
    message: string
    project?: Project
}

interface ProjectsResponse {
    success: boolean
    projects: Project[]
}

export async function getAllProjects(): Promise<ProjectsResponse> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { projects: [], success: false }
        }

        const projects = await prisma.project.findMany({
            where: { userId: user.id }
        })
        return { projects, success: true }
    } catch (error) {
        console.error('Failed to fetch projects:', error)
        return { projects: [], success: false }
    }
}

export async function getProject(id: string): Promise<ProjectResponse> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { project: undefined, success: false, message: 'User not authenticated' }
        }

        const project = await prisma.project.findUnique({
            where: { 
                id,
                userId: user.id
            }
        }) ?? undefined
        return { project, success: true, message: 'Project fetched successfully' }
    } catch (error) {
        console.error('Failed to fetch project:', error)
        return { project: undefined, success: false, message: 'Failed to fetch project' }
    }
}

export async function createProject(name: string, description: string): Promise<ProjectResponse> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, message: 'User not authenticated' }
        }

        const project = await prisma.project.create({
            data: {
                name,
                description: description || null,
                userId: user.id
            },
        })
        return { project, success: true, message: 'Project created successfully' }
    } catch (error) {
        console.error('Failed to create project:', error)
        return { success: false, message: 'Failed to create project' }
    }
}

export async function updateProject(id: string, name: string, description: string): Promise<ProjectResponse> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, message: 'User not authenticated' }
        }

        const project = await prisma.project.update({
            where: { 
                id,
                userId: user.id
            },
            data: {
                name,
                description: description || null,
            },
        })
        return { project, success: true, message: 'Project updated successfully' }
    } catch (error) {
        console.error('Failed to update project:', error)
        return { success: false, message: 'Failed to update project' }
    }
}

export async function deleteProject(id: string): Promise<ProjectResponse> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, message: 'User not authenticated' }
        }

        const project = await prisma.project.delete({
            where: { 
                id,
                userId: user.id
            },
        })
        return { success: true, message: 'Project deleted successfully', project }
    } catch (error) {
        console.error('Failed to delete project:', error)
        return { success: false, message: 'Failed to delete project' }
    }
}