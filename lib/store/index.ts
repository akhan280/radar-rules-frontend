import { create } from 'zustand'
import { createProjectSlice, ProjectSlice } from './project-slice'
import { useShallow } from 'zustand/react/shallow'

export type StoreState = ProjectSlice

export const useMainStore = create<StoreState>()((...args) => ({
  ...createProjectSlice(...args),
}))