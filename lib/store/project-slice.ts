import { StateCreator } from 'zustand'
import { Project } from '@prisma/client'
import {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
} from '@/lib/actions/project-actions'

export interface ProjectSlice {
  projects: Project[]
  isLoading: boolean
  error: string | null
  fetchProjects: () => Promise<void>
  addProject: (name: string, description: string) => Promise<{ project: Project | null; success: boolean }>
  updateProject: (id: string, name: string, description: string) => Promise<{ success: boolean }>
  removeProject: (id: string) => Promise<{ success: boolean }>
}

export const createProjectSlice: StateCreator<ProjectSlice> = (set) => ({
  projects: [],
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null })
    try {
      const { projects, success } = await getAllProjects()
      if (success) {
        set({ projects })
      } else {
        set({ error: 'Failed to fetch projects' })
      }
    } catch (error) {
      set({ error: 'An error occurred while fetching projects' })
    } finally {
      set({ isLoading: false })
    }
  },

  addProject: async (name: string, description: string) => {
    const result = await createProject(name, description)
    if (result.success && result.project) {
      set((state) => ({ projects: [...state.projects, result.project!] }))
    }
    return { project: result.project || null, success: result.success }
  },

  updateProject: async (id: string, name: string, description: string) => {
    const result = await updateProject(id, name, description)
    if (result.success) {
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id ? { ...p, name, description: description || null } : p
        ),
      }))
    }
    return result
  },

  removeProject: async (id: string) => {
    const result = await deleteProject(id)
    if (result.success) {
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
      }))
    }
    return result
  },
}) 