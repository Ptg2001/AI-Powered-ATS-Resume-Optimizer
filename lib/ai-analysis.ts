// AI-powered analysis utilities (with heuristic fallback)

export interface SkillMatch {
  skill: string
  resumeHas: boolean
  jobRequires: boolean
  confidence: number
  importance: "high" | "medium" | "low"
}

export interface ATSScoreBreakdown {
  skillsMatch: number
  keywordsMatch: number
  experienceRelevance: number
  formatScore: number
  overall: number
}

export interface AnalysisResult {
  score: ATSScoreBreakdown
  skillMatches: SkillMatch[]
  matchedSkills: string[]
  missingSkills: string[]
  weakSkills: string[]
  recommendations: string[]
  keywordDensity: Record<string, number>
}

// Enhanced AI analysis with Puter.ai if available; falls back to heuristic
export async function analyzeResumeWithAI(resumeText: string, jobDescription: string): Promise<AnalysisResult> {
  await new Promise((resolve) => setTimeout(resolve, 200))

  try {
    // Try Puter if present, otherwise skip
    // @ts-expect-error global
    const puter = typeof window !== "undefined" ? window.puter : undefined
    if (puter && puter.ai?.chat) {
      const system = `You are an ATS evaluator. Return ONLY JSON matching this interface: {"score":{"skillsMatch":number,"keywordsMatch":number,"experienceRelevance":number,"formatScore":number,"overall":number},"skillMatches":Array<{"skill":string,"resumeHas":boolean,"jobRequires":boolean,"confidence":number,"importance":"high"|"medium"|"low"}>,"matchedSkills":string[],"missingSkills":string[],"weakSkills":string[],"recommendations":string[],"keywordDensity":Record<string,number>}`
      const user = `RESUME:\n${resumeText}\n\nJOB:\n${jobDescription}`
      const resp = await puter.ai.chat(`${system}\n\n${user}`)
      const text = typeof resp === "string" ? resp : resp?.text || JSON.stringify(resp)
      const parsed = JSON.parse(text)
      if (parsed?.score?.overall && Array.isArray(parsed.skillMatches)) {
        parsed.score = {
          skillsMatch: clamp(parsed.score.skillsMatch),
          keywordsMatch: clamp(parsed.score.keywordsMatch),
          experienceRelevance: clamp(parsed.score.experienceRelevance),
          formatScore: clamp(parsed.score.formatScore),
          overall: clamp(parsed.score.overall),
        }
        return parsed as AnalysisResult
      }
    }
  } catch (e) {
    // swallow and fallback
  }

  // Heuristic fallback
  const resumeSkills = await extractSkillsFromResume(resumeText)
  const jobSkills = await extractSkillsFromJob(jobDescription)
  const skillMatches = await compareSkills(resumeSkills, jobSkills)

  const matchedSkills = skillMatches.filter((s) => s.resumeHas && s.jobRequires).map((s) => s.skill)
  const missingSkills = skillMatches.filter((s) => !s.resumeHas && s.jobRequires).map((s) => s.skill)
  const weakSkills = skillMatches.filter((s) => s.resumeHas && s.jobRequires && s.confidence < 0.7).map((s) => s.skill)

  const score = calculateATSScore(skillMatches, resumeText, jobDescription)
  const recommendations = generateRecommendations(skillMatches, score)
  const keywordDensity = calculateKeywordDensity(resumeText, jobDescription)

  return {
    score,
    skillMatches,
    matchedSkills,
    missingSkills,
    weakSkills,
    recommendations,
    keywordDensity,
  }
}

function clamp(v: number) {
  return Math.max(0, Math.min(100, Math.round(v || 0)))
}

async function extractSkillsFromResume(resumeText: string): Promise<string[]> {
  const technicalSkills = [
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "Python",
    "Java",
    "C++",
    "C#",
    "Go",
    "Rust",
    "HTML",
    "CSS",
    "SQL",
    "MongoDB",
    "PostgreSQL",
    "MySQL",
    "Redis",
    "Docker",
    "Kubernetes",
    "AWS",
    "Azure",
    "GCP",
    "Git",
    "Jenkins",
    "CI/CD",
    "DevOps",
    "Linux",
    "Windows",
    "macOS",
    "Angular",
    "Vue.js",
    "Svelte",
    "Express",
    "Django",
    "Flask",
    "Spring",
    "Laravel",
    "Rails",
    "GraphQL",
    "REST API",
    "Microservices",
    "Machine Learning",
    "AI",
    "Data Science",
    "Analytics",
  ]

  const softSkills = [
    "Leadership",
    "Communication",
    "Problem Solving",
    "Team Collaboration",
    "Project Management",
    "Agile",
    "Scrum",
    "Critical Thinking",
    "Adaptability",
    "Time Management",
    "Mentoring",
  ]

  const allSkills = [...technicalSkills, ...softSkills]
  const text = resumeText.toLowerCase()

  return allSkills.filter(
    (skill) => text.includes(skill.toLowerCase()) || text.includes(skill.toLowerCase().replace(/\s+/g, "")),
  )
}

async function extractSkillsFromJob(jobDescription: string): Promise<string[]> {
  const text = jobDescription.toLowerCase()
  const requiredPatterns = [
    /required[:\s]+([^.]+)/gi,
    /must have[:\s]+([^.]+)/gi,
    /essential[:\s]+([^.]+)/gi,
    /qualifications[:\s]+([^.]+)/gi,
  ]

  const skills = new Set<string>()

  requiredPatterns.forEach((pattern) => {
    const matches = text.match(pattern)
    if (matches) {
      matches.forEach((match) => {
        const skillText = match.replace(/required[:\s]+|must have[:\s]+|essential[:\s]+|qualifications[:\s]+/gi, "")
        const extractedSkills = skillText
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 2)
        extractedSkills.forEach((skill) => skills.add(skill))
      })
    }
  })

  const commonSkills = await extractSkillsFromResume(jobDescription)
  commonSkills.forEach((skill) => skills.add(skill))

  return Array.from(skills).slice(0, 20)
}

async function compareSkills(resumeSkills: string[], jobSkills: string[]): Promise<SkillMatch[]> {
  const allSkills = new Set([...resumeSkills, ...jobSkills])

  return Array.from(allSkills).map((skill) => {
    const resumeHas = resumeSkills.some(
      (rs) =>
        rs.toLowerCase() === skill.toLowerCase() ||
        rs.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(rs.toLowerCase()),
    )

    const jobRequires = jobSkills.some(
      (js) =>
        js.toLowerCase() === skill.toLowerCase() ||
        js.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(js.toLowerCase()),
    )

    let confidence = 0.5
    if (resumeHas && jobRequires) confidence = 0.9
    else if (resumeHas || jobRequires) confidence = 0.7

    let importance: "high" | "medium" | "low" = "medium"
    const highImportanceSkills = ["JavaScript", "Python", "React", "Node.js", "AWS", "SQL", "Leadership", "Communication"]
    if (highImportanceSkills.some((his) => skill.toLowerCase().includes(his.toLowerCase()))) {
      importance = "high"
    }

    return {
      skill,
      resumeHas,
      jobRequires,
      confidence,
      importance,
    }
  })
}

function calculateATSScore(skillMatches: SkillMatch[], resumeText: string, jobDescription: string): ATSScoreBreakdown {
  const totalRequiredSkills = skillMatches.filter((s) => s.jobRequires).length
  const matchedRequiredSkills = skillMatches.filter((s) => s.resumeHas && s.jobRequires).length

  const skillsMatch = totalRequiredSkills > 0 ? (matchedRequiredSkills / totalRequiredSkills) * 100 : 0

  const jobWords = jobDescription.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
  const resumeWords = resumeText.toLowerCase().split(/\s+/)
  const matchedKeywords = jobWords.filter((word) => resumeWords.includes(word)).length
  const keywordsMatch = jobWords.length > 0 ? (matchedKeywords / jobWords.length) * 100 : 0

  const experienceKeywords = ["experience", "years", "worked", "developed", "managed", "led"]
  const hasExperienceKeywords = experienceKeywords.some((kw) => resumeText.toLowerCase().includes(kw))
  const experienceRelevance = hasExperienceKeywords ? 85 : 60

  const formatScore = 90

  const overall = Math.round(skillsMatch * 0.4 + keywordsMatch * 0.3 + experienceRelevance * 0.2 + formatScore * 0.1)

  return {
    skillsMatch: Math.round(skillsMatch),
    keywordsMatch: Math.round(keywordsMatch),
    experienceRelevance: Math.round(experienceRelevance),
    formatScore: Math.round(formatScore),
    overall: Math.max(0, Math.min(100, overall)),
  }
}

function generateRecommendations(skillMatches: SkillMatch[], score: ATSScoreBreakdown): string[] {
  const recommendations: string[] = []

  const missingHighImportanceSkills = skillMatches
    .filter((s) => !s.resumeHas && s.jobRequires && s.importance === "high")
    .map((s) => s.skill)

  if (missingHighImportanceSkills.length > 0) {
    recommendations.push(`Add these critical skills to your resume: ${missingHighImportanceSkills.slice(0, 3).join(", ")}`)
  }

  if (score.skillsMatch < 60) {
    recommendations.push("Consider highlighting more relevant technical skills that match the job requirements")
  }

  if (score.keywordsMatch < 50) {
    recommendations.push("Include more keywords from the job description throughout your resume")
  }

  if (score.experienceRelevance < 70) {
    recommendations.push("Emphasize relevant work experience and quantify your achievements")
  }

  recommendations.push("Use action verbs and quantify your accomplishments where possible")
  recommendations.push("Ensure your resume format is ATS-friendly with clear section headers")

  return recommendations.slice(0, 5)
}

function calculateKeywordDensity(resumeText: string, jobDescription: string): Record<string, number> {
  const jobWords = jobDescription
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .filter(
      (w) =>
        ![
          "the",
          "and",
          "for",
          "are",
          "but",
          "not",
          "you",
          "all",
          "can",
          "had",
          "her",
          "was",
          "one",
          "our",
          "out",
          "day",
          "get",
          "has",
          "him",
          "his",
          "how",
          "its",
          "may",
          "new",
          "now",
          "old",
          "see",
          "two",
          "who",
          "boy",
          "did",
          "she",
          "use",
          "way",
          "will",
          "with",
          "this",
          "that",
          "they",
          "have",
          "from",
          "they",
          "know",
          "want",
          "been",
          "good",
          "much",
          "some",
          "time",
          "very",
          "when",
          "come",
          "here",
          "just",
          "like",
          "long",
          "make",
          "many",
          "over",
          "such",
          "take",
          "than",
          "them",
          "well",
          "were",
        ].includes(w),
    )

  const wordCount = jobWords.reduce(
    (acc, word) => {
      acc[word] = (acc[word] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const topKeywords = Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .reduce(
      (acc, [word, count]) => {
        acc[word] = count
        return acc
      },
      {} as Record<string, number>,
    )

  return topKeywords
}

export interface UserSkillConfirmation {
  skill: string
  hasSkill: boolean
  proficiencyLevel: "beginner" | "intermediate" | "advanced" | "expert"
  yearsOfExperience?: number
}

export function generateSkillConfirmationList(skillMatches: SkillMatch[]): UserSkillConfirmation[] {
  return skillMatches
    .filter((s) => s.jobRequires)
    .map((s) => ({
      skill: s.skill,
      hasSkill: s.resumeHas,
      proficiencyLevel: s.resumeHas ? "intermediate" : "beginner",
      yearsOfExperience: s.resumeHas ? 2 : 0,
    }))
}
