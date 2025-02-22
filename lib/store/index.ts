import { create } from 'zustand'
import { createProjectSlice, ProjectSlice } from './project-slice'
import { useShallow } from 'zustand/react/shallow'

export type StoreState = ProjectSlice

export const useStore = create<StoreState>()((...args) => ({
  ...createProjectSlice(...args),
}))

// Selector hooks with shallow comparison
export const useProjects = () => useStore(useShallow((state) => ({
  projects: state.projects,
  isLoading: state.isLoading,
  error: state.error,
})))

export const useProjectActions = () => useStore(useShallow((state) => ({
  fetchProjects: state.fetchProjects,
  addProject: state.addProject,
  updateProject: state.updateProject,
  removeProject: state.removeProject,
}))) 