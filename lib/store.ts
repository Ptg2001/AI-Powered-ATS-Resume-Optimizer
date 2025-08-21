import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface ResumeFile {
  id: string
  name: string
  size: number
  type: string
  content: string
  uploadedAt: Date
  extractedText?: string
}

export interface JobDescription {
  id: string
  title: string
  company: string
  content: string
  createdAt: Date
  extractedSkills?: string[]
  extractedKeywords?: string[]
}

export interface ATSAnalysis {
  id: string
  resumeId: string
  jobDescriptionId: string
  score: number
  matchedSkills: string[]
  missingSkills: string[]
  weakSkills: string[]
  recommendations: string[]
  createdAt: Date
}

interface ATSStore {
  // Resume management
  resumes: ResumeFile[]
  currentResume: ResumeFile | null
  addResume: (resume: ResumeFile) => void
  removeResume: (id: string) => void
  setCurrentResume: (resume: ResumeFile | null) => void

  // Job description management
  jobDescriptions: JobDescription[]
  currentJobDescription: JobDescription | null
  addJobDescription: (jd: JobDescription) => void
  removeJobDescription: (id: string) => void
  setCurrentJobDescription: (jd: JobDescription | null) => void
  updateJobDescription: (jd: JobDescription) => void

  // Analysis management
  analyses: ATSAnalysis[]
  currentAnalysis: ATSAnalysis | null
  addAnalysis: (analysis: ATSAnalysis) => void
  setCurrentAnalysis: (analysis: ATSAnalysis | null) => void

  // Template selection
  selectedTemplate: string | null
  setSelectedTemplate: (templateId: string) => void

  // Hydration from cloud
  hydrateFromCloud: (payload: { resumes: any[]; jobs: any[]; analyses: any[] }) => void

  // UI state
  isUploading: boolean
  setIsUploading: (uploading: boolean) => void
  uploadProgress: number
  setUploadProgress: (progress: number) => void
}

export const useATSStore = create<ATSStore>()(
  persist(
    (set, get) => ({
      // Resume state
      resumes: [],
      currentResume: null,
      addResume: (resume) =>
        set((state) => ({
          resumes: [...state.resumes, resume],
          currentResume: resume,
        })),
      removeResume: (id) =>
        set((state) => ({
          resumes: state.resumes.filter((r) => r.id !== id),
          currentResume: state.currentResume?.id === id ? null : state.currentResume,
        })),
      setCurrentResume: (resume) => set({ currentResume: resume }),

      // Job description state
      jobDescriptions: [],
      currentJobDescription: null,
      addJobDescription: (jd) =>
        set((state) => ({
          jobDescriptions: [...state.jobDescriptions, jd],
          currentJobDescription: jd,
        })),
      removeJobDescription: (id) =>
        set((state) => ({
          jobDescriptions: state.jobDescriptions.filter((jd) => jd.id !== id),
          currentJobDescription: state.currentJobDescription?.id === id ? null : state.currentJobDescription,
        })),
      setCurrentJobDescription: (jd) => set({ currentJobDescription: jd }),
      updateJobDescription: (updated) =>
        set((state) => ({
          jobDescriptions: state.jobDescriptions.map((jd) => (jd.id === updated.id ? updated : jd)),
          currentJobDescription: state.currentJobDescription?.id === updated.id ? updated : state.currentJobDescription,
        })),

      // Analysis state
      analyses: [],
      currentAnalysis: null,
      addAnalysis: (analysis) =>
        set((state) => ({
          analyses: [...state.analyses, analysis],
          currentAnalysis: analysis,
        })),
      setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),

      // Template selection
      selectedTemplate: null,
      setSelectedTemplate: (templateId) => set({ selectedTemplate: templateId }),

      // Hydration from cloud
      hydrateFromCloud: ({ resumes, jobs, analyses }) => {
        const mapById = <T extends { id: string }>(arr: T[]) => {
          const m = new Map<string, T>()
          arr.forEach((item) => m.set(item.id, item))
          return m
        }
        const state = get()
        // Deserialize dates
        const toResume = (r: any) => ({ ...r, uploadedAt: new Date(r.uploadedAt || Date.now()) }) as ResumeFile
        const toJob = (j: any) => ({ ...j, createdAt: new Date(j.createdAt || Date.now()) }) as JobDescription
        const toAnalysis = (a: any) => ({ ...a, createdAt: new Date(a.createdAt || Date.now()) }) as ATSAnalysis
        const resumeMap = mapById([...state.resumes, ...resumes.map(toResume)])
        const jobMap = mapById([...state.jobDescriptions, ...jobs.map(toJob)])
        const analysisMap = mapById([...state.analyses, ...analyses.map(toAnalysis)])
        set({
          resumes: Array.from(resumeMap.values()),
          jobDescriptions: Array.from(jobMap.values()),
          analyses: Array.from(analysisMap.values()),
        })
      },

      // UI state
      isUploading: false,
      setIsUploading: (uploading) => set({ isUploading: uploading }),
      uploadProgress: 0,
      setUploadProgress: (progress) => set({ uploadProgress: progress }),
    }),
    {
      name: "ats-storage",
      partialize: (state) => ({
        resumes: state.resumes,
        jobDescriptions: state.jobDescriptions,
        analyses: state.analyses,
        selectedTemplate: state.selectedTemplate,
      }),
    },
  ),
)
