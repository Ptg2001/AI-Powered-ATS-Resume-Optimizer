export type CheckCategory = "Content" | "Format" | "Skills" | "Sections" | "Style"

export interface ResumeCheck {
  id: string
  label: string
  category: CheckCategory
  pass: boolean
  suggestion?: string
}

export interface ResumeCheckResult {
  score: number
  checks: ResumeCheck[]
  byCategory: Record<CheckCategory, ResumeCheck[]>
}

const BUZZWORDS = [
  "synergy",
  "go-getter",
  "hard worker",
  "team player",
  "results-driven",
  "problem solver",
  "out-of-the-box",
  "guru",
  "ninja",
  "rockstar",
]

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
}

function countWords(text: string) {
  return tokenize(text).length
}

function hasPassiveVoice(text: string) {
  // Simple passive voice heuristic
  return /(was|were|is|are|be|been|being)\s+\w+ed\b|\bby\b/.test(text.toLowerCase())
}

function hasQuantification(text: string) {
  return /(\d+%|\b\d+\b)/.test(text)
}

function detectLongBullets(text: string) {
  return text
    .split(/\n/)
    .filter((l) => l.trim().startsWith("-"))
    .some((l) => l.length > 180)
}

export function runResumeChecks(resumeTextRaw: string, jobTextRaw: string): ResumeCheckResult {
  const resumeText = (resumeTextRaw || "").slice(0, 20000)
  const jobText = (jobTextRaw || "").slice(0, 20000)

  const words = countWords(resumeText)
  const tooShort = words < 120
  const tooLong = words > 1200

  const hasSections = /summary|experience|education|projects|skills/i.test(resumeText)
  const hasContact = /@|\+?\d[\d\s-]{6,}/.test(resumeText)

  const quant = hasQuantification(resumeText)
  const passive = hasPassiveVoice(resumeText)
  const longBullets = detectLongBullets(resumeText)

  const buzzwordFound = BUZZWORDS.some((b) => resumeText.toLowerCase().includes(b))

  const jobTokens = new Set(tokenize(jobText))
  const resumeTokens = new Set(tokenize(resumeText))
  const overlap = Array.from(jobTokens).filter((t) => resumeTokens.has(t)).length
  const coverage = jobTokens.size ? Math.round((overlap / jobTokens.size) * 100) : 0

  const checks: ResumeCheck[] = [
    // Content
    {
      id: "parse",
      label: "ATS parse rate (heuristic)",
      category: "Content",
      pass: words >= 80,
      suggestion: words < 80 ? "Add more content and clear sections for better parse." : undefined,
    },
    {
      id: "quant",
      label: "Quantified achievements present",
      category: "Content",
      pass: quant,
      suggestion: quant ? undefined : "Add numbers (%, $ or counts) to quantify impact.",
    },
    {
      id: "repetition",
      label: "Avoid excessively long bullets",
      category: "Content",
      pass: !longBullets,
      suggestion: longBullets ? "Split long bullets into 1-2 concise lines each." : undefined,
    },

    // Format
    {
      id: "length",
      label: "Resume length is reasonable",
      category: "Format",
      pass: !tooShort && !tooLong,
      suggestion: tooShort ? "Add more role details and context." : tooLong ? "Trim to most relevant achievements." : undefined,
    },

    // Skills
    {
      id: "keywords",
      label: "JD keyword coverage",
      category: "Skills",
      pass: coverage >= 50,
      suggestion: coverage < 50 ? "Mirror key terms from the JD throughout your summary and experience." : undefined,
    },

    // Sections
    {
      id: "contact",
      label: "Contact information present",
      category: "Sections",
      pass: hasContact,
      suggestion: hasContact ? undefined : "Add email and phone number at the top.",
    },
    {
      id: "sections",
      label: "Essential sections included",
      category: "Sections",
      pass: hasSections,
      suggestion: hasSections ? undefined : "Include Summary, Experience, Education, Projects and Skills sections.",
    },

    // Style
    {
      id: "active",
      label: "Active voice over passive",
      category: "Style",
      pass: !passive,
      suggestion: passive ? "Rewrite passive sentences into active voice (e.g., 'Led a team...' instead of 'Was responsible for')." : undefined,
    },
    {
      id: "buzz",
      label: "Avoid buzzwords and cliches",
      category: "Style",
      pass: !buzzwordFound,
      suggestion: buzzwordFound ? "Remove buzzwords (e.g., synergy, ninja) and use specific achievements." : undefined,
    },
  ]

  // Score weighting inspired by public guidance: content+coverage+style matter
  let score = 0
  for (const c of checks) {
    const weight =
      c.category === "Content" ? 15 : c.category === "Skills" ? 20 : c.category === "Sections" ? 10 : c.category === "Style" ? 10 : 10
    score += (c.pass ? 1 : 0) * weight
  }
  score = Math.max(0, Math.min(100, score))

  const byCategory: Record<CheckCategory, ResumeCheck[]> = {
    Content: [],
    Format: [],
    Skills: [],
    Sections: [],
    Style: [],
  }
  checks.forEach((c) => byCategory[c.category].push(c))

  return { score, checks, byCategory }
}
