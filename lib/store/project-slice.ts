import { StateCreator } from 'zustand'
import { Project, CsvUpload, FraudAnalysisResult } from '@prisma/client'
import {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
} from '@/lib/actions/project-actions'

export interface ExtendedCsvUpload extends CsvUpload {
  results: FraudAnalysisResult[];
}

export interface ExtendedProject extends Project {
  csvUploads: ExtendedCsvUpload[];
}

export interface ProjectSlice {
  projects: ExtendedProject[]
  selectedProject: ExtendedProject | null
  isLoading: boolean
  error: string | null
  
  fetchProjects: () => Promise<void>
  addProject: (name: string, description: string) => Promise<{ project: Project | null; success: boolean }>
  updateProject: (id: string, name: string, description: string) => Promise<{ success: boolean }>
  removeProject: (id: string) => Promise<{ success: boolean }>
  
  initializeProjectUploads: (projectId: string, uploads: ExtendedCsvUpload[]) => void
  addCsvUpload: (projectId: string, csvUpload: ExtendedCsvUpload) => void
  removeCsvUpload: (projectId: string, uploadId: string) => void
  updateCsvUpload: (projectId: string, csvUploadId: string, updates: Partial<ExtendedCsvUpload>) => void
}

export const createProjectSlice: StateCreator<ProjectSlice> = (set) => ({
  projects: [],
  selectedProject: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null })
    try {
      const { projects, success } = await getAllProjects()
      if (success) {
        set({ projects: projects as ExtendedProject[] })
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
      set((state) => ({ 
        projects: [...state.projects, { ...result.project!, csvUploads: [] } as ExtendedProject] 
      }))
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

  addCsvUpload: (projectId: string, csvUpload: ExtendedCsvUpload) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? { ...project, csvUploads: [...project.csvUploads, csvUpload] }
          : project
      ),
    }))
  },

  updateCsvUpload: (projectId: string, csvUploadId: string, updates: Partial<ExtendedCsvUpload>) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              csvUploads: project.csvUploads.map((upload) =>
                upload.id === csvUploadId
                  ? { ...upload, ...updates }
                  : upload
              ),
            }
          : project
      ),
    }))
  },

  initializeProjectUploads: (projectId: string, uploads: ExtendedCsvUpload[]) => {
    console.log(`projectID`, projectId, uploads)
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? { ...project, csvUploads: uploads }
          : project
      ),
    }))
  },

  removeCsvUpload: (projectId: string, uploadId: string) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              csvUploads: project.csvUploads.filter(
                (upload) => upload.id !== uploadId
              ),
            }
          : project
      ),
    }))
  },
}) 