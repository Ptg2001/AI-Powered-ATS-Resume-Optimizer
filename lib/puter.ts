// Minimal Puter.js type-safe helpers for client-side usage

export type Puter = {
  ai: {
    chat: (prompt: string, imageUrlOrOptions?: any) => Promise<any>
  }
  auth: {
    signIn: () => Promise<any>
    signOut: () => Promise<void>
    isSignedIn: () => boolean
    getUser: () => Promise<{ id?: string; email?: string; name?: string } | null>
  }
  fs: {
    write: (path: string, data: Blob | string) => Promise<{ path: string }>
    read: (path: string) => Promise<Blob>
    mkdir: (path: string) => Promise<void>
    readdir: (path: string) => Promise<Array<{ name: string; path: string }>>
    stat: (path: string) => Promise<{ isDir: boolean; isFile: boolean }>
  }
}

export function getPuter(): Puter | null {
  if (typeof window === "undefined") return null
  // @ts-expect-error global injected by script
  const p = window.puter as Puter | undefined
  return p ?? null
}

export async function ensureSignedIn(): Promise<void> {
  const puter = getPuter()
  if (!puter) return
  try {
    const signedIn = puter.auth.isSignedIn()
    if (!signedIn) {
      await puter.auth.signIn()
    }
  } catch (err) {
    // Ignore; caller can handle auth UI
    console.warn("Puter auth ensureSignedIn failed", err)
  }
}

export async function getCurrentUser(): Promise<{ id: string; email?: string; name?: string } | null> {
  const puter = getPuter()
  if (!puter) return null
  try {
    const user = await puter.auth.getUser()
    if (!user) return null
    return {
      id: (user as any).id ?? "",
      email: (user as any).email,
      name: (user as any).name,
    }
  } catch (e) {
    return null
  }
}

export async function aiChat(prompt: string): Promise<string> {
  const puter = getPuter()
  if (!puter) throw new Error("Puter not available")
  const resp = await puter.ai.chat(prompt)
  if (typeof resp === "string") return resp
  // Some environments return object with text
  if (resp && typeof resp.text === "string") return resp.text
  return JSON.stringify(resp)
}

const ROOT_DIR = "/ats-app"

async function ensureDir(path: string) {
  const puter = getPuter()
  if (!puter) return
  try {
    await puter.fs.mkdir(path)
  } catch (_) {
    // likely exists
  }
}

export async function writeJSON(path: string, data: any): Promise<void> {
  const puter = getPuter()
  if (!puter) return
  await ensureDir(ROOT_DIR)
  const full = `${ROOT_DIR}/${path}`.replace(/\/+/, "/")
  await puter.fs.write(full, JSON.stringify(data, null, 2))
}

export async function readJSON<T>(path: string): Promise<T | null> {
  const puter = getPuter()
  if (!puter) return null
  const full = `${ROOT_DIR}/${path}`.replace(/\/+/, "/")
  try {
    const blob = await puter.fs.read(full)
    const text = await blob.text()
    return JSON.parse(text) as T
  } catch (e) {
    return null
  }
}

export async function listDir(path: string): Promise<string[]> {
  const puter = getPuter()
  if (!puter) return []
  const full = `${ROOT_DIR}/${path}`.replace(/\/+/, "/")
  try {
    const entries = await puter.fs.readdir(full)
    return entries.map((e) => e.path)
  } catch {
    return []
  }
}

export const paths = {
  resumes: "resumes",
  jobs: "jobs",
  analyses: "analyses",
  optimized: "optimized",
}

export async function saveResumeToCloud(resume: any) {
  await ensureDir(`${ROOT_DIR}/${paths.resumes}`)
  return writeJSON(`${paths.resumes}/${resume.id}.json`, resume)
}

export async function saveJobToCloud(job: any) {
  await ensureDir(`${ROOT_DIR}/${paths.jobs}`)
  return writeJSON(`${paths.jobs}/${job.id}.json`, job)
}

export async function saveAnalysisToCloud(analysis: any) {
  await ensureDir(`${ROOT_DIR}/${paths.analyses}`)
  return writeJSON(`${paths.analyses}/${analysis.id}.json`, analysis)
}

export async function loadAllFromCloud(): Promise<{ resumes: any[]; jobs: any[]; analyses: any[] }> {
  const [resumePaths, jobPaths, analysisPaths] = await Promise.all([
    listDir(paths.resumes),
    listDir(paths.jobs),
    listDir(paths.analyses),
  ])
  const readMany = async (p: string[]) => {
    const results = await Promise.all(
      p.map(async (fullPath) => {
        const rel = fullPath.replace(/^\/?ats-app\/?/, "").replace(/^\/?/, "")
        const data = await readJSON<any>(rel)
        return data
      }),
    )
    return results.filter(Boolean)
  }
  const [resumes, jobs, analyses] = await Promise.all([
    readMany(resumePaths),
    readMany(jobPaths),
    readMany(analysisPaths),
  ])
  return { resumes, jobs, analyses }
}

export async function writeText(path: string, data: string): Promise<void> {
  const puter = getPuter()
  if (!puter) return
  await ensureDir(ROOT_DIR)
  const full = `${ROOT_DIR}/${path}`.replace(/\/+/, "/")
  await puter.fs.write(full, new Blob([data], { type: "text/plain;charset=utf-8" }))
}

export async function saveOptimizedResumeToCloud(payload: { resumeId: string; jobId: string; content: string }) {
  await ensureDir(`${ROOT_DIR}/${paths.optimized}`)
  const safeName = `${payload.resumeId}_${payload.jobId}.txt`
  return writeText(`${paths.optimized}/${safeName}`, payload.content)
} 