"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Sparkles } from "lucide-react"
import { useATSStore } from "@/lib/store"
import { Progress } from "@/components/ui/progress"
import { runResumeChecks } from "@/lib/checker"
import { AIAssistant } from "@/components/ai-assistant"

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

export function ManualResumeBuilder({ onGenerated }: { onGenerated: (text: string) => void }) {
  const { currentJobDescription, currentResume } = useATSStore()
  const jdSkills = (currentJobDescription?.extractedSkills || []).slice(0, 15)
  const jdKeywords = (currentJobDescription?.extractedKeywords || []).slice(0, 15)

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    titleTarget: "",
    summary: "",
    skills: "",
    softSkills: "",
    experience: "",
    education: "",
    projects: "",
    certifications: "",
    tools: "",
    achievements: "",
    languages: "",
    linkedin: "",
    github: "",
    portfolio: "",
    authorization: "",
    availability: "",
    location: "",
    keywordsSelected: [] as string[],
  })
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)

  const isValidEmail = (email: string) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(email)
  const parsedSkills = useMemo(() => form.skills.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean), [form.skills])
  const summaryInvalid = useMemo(() => form.summary.trim().length > 0 && form.summary.trim().length < 30, [form.summary])
  const skillsInvalid = useMemo(() => parsedSkills.length > 0 && parsedSkills.length < 3, [parsedSkills])
  const expValid = useMemo(() => form.experience.trim().length >= 30, [form.experience])
  const projectsValid = useMemo(() => form.projects.trim().length >= 30, [form.projects])

  const builderDisabled = useMemo(() => {
    const hasContact = (form.email && isValidEmail(form.email)) || form.phone.trim().length >= 7
    const nameInvalid = form.name.trim().length < 2
    const requireSummary = form.summary.trim().length < 30
    const requireSkills = parsedSkills.length < 3
    const requireExpOrProj = !(expValid || projectsValid)
    return nameInvalid || !hasContact || requireSummary || requireSkills || requireExpOrProj
  }, [form, parsedSkills, expValid, projectsValid])

  const fieldClass = "bg-white dark:bg-card border border-border focus:ring-2 focus:ring-primary/30"

  const bulletize = (text: string) =>
    text
      .split(/\n|[,;] */)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (s.startsWith("-") ? s : `- ${s}`))
      .join("\n")

  const linkLine = (label: string, url: string) => (url ? `${label}: ${url}` : "")

  const makeResumeText = (f: typeof form) => {
    const headerLines = [f.name, [f.email, f.phone].filter(Boolean).join(" | ")].filter(Boolean).join("\n")

    const sections: string[] = []
    if (f.titleTarget) sections.push(`Target Role\n${f.titleTarget}`)

    sections.push(`Summary\n${f.summary}`)

    const allKeywords = Array.from(new Set([...(f.keywordsSelected || []), ...f.skills.split(/[ ,\n;]+/).map((s) => s.trim())].filter(Boolean)))
    if (allKeywords.length) sections.push(`Keywords\n${bulletize(allKeywords.join(", "))}`)

    if (f.skills) sections.push(`Skills\n${bulletize(f.skills)}`)
    if (f.softSkills) sections.push(`Soft Skills\n${bulletize(f.softSkills)}`)
    if (f.tools) sections.push(`Tools & Technologies\n${bulletize(f.tools)}`)
    if (f.certifications) sections.push(`Certifications\n${bulletize(f.certifications)}`)

    if (f.experience) sections.push(`Experience\n${f.experience}`)
    if (f.achievements) sections.push(`Achievements\n${bulletize(f.achievements)}`)

    if (f.education) sections.push(`Education\n${f.education}`)
    if (f.projects) sections.push(`Projects\n${f.projects}`)

    const miscLines = [
      linkLine("LinkedIn", f.linkedin),
      linkLine("GitHub", f.github),
      linkLine("Portfolio", f.portfolio),
      f.languages ? `Languages: ${f.languages}` : "",
      f.authorization ? `Work Authorization: ${f.authorization}` : "",
      f.availability ? `Availability: ${f.availability}` : "",
      f.location ? `Location: ${f.location}` : "",
    ].filter(Boolean)
    if (miscLines.length) sections.push(miscLines.join("\n"))

    return [headerLines, ...sections].filter(Boolean).join("\n\n").trim()
  }

  function extractTokens(text: string): string[] {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !["the", "and", "for", "with", "this", "that", "have", "from", "into", "over", "your"].includes(w))
    const counts = new Map<string, number>()
    for (const w of words) counts.set(w, (counts.get(w) || 0) + 1)
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([w]) => w)
  }

  const aiAssist = async () => {
    setLoading(true)
    try {
      const resumeText = (currentResume?.extractedText || currentResume?.content || "").slice(0, 20000)
      const jdText = (currentJobDescription?.content || "").slice(0, 20000)
      const resumeTop = extractTokens(resumeText).slice(0, 30)
      const jdTop = extractTokens(jdText).slice(0, 30)
      const missing = jdTop.filter((w) => !resumeTop.includes(w)).slice(0, 10)

      const suggestions = [
        "Use action verbs like led, built, delivered, optimized",
        "Quantify impact (e.g., improved performance by 30%)",
        "Align skills and keywords with the job description",
      ]
      const updated = { ...form }
      if (!updated.titleTarget) updated.titleTarget = currentJobDescription?.title || ""

      if (!updated.summary) {
        const keySkills = jdSkills.slice(0, 3).join(", ")
        updated.summary = `Experienced ${updated.titleTarget || "professional"} with strengths in ${keySkills}. ${suggestions[0]}. ${suggestions[1]}.` 
      }

      if (!updated.skills) {
        const seedSkills = Array.from(new Set([...jdSkills.slice(0, 8), ...missing.filter((m) => m.length > 3)]))
        updated.skills = seedSkills.slice(0, 10).join(", ")
      }

      if (!updated.tools) {
        updated.tools = jdSkills
          .filter((s) => /aws|docker|kubernetes|sql|react|node|typescript|python|java|graphql/i.test(s))
          .join(", ")
      }

      if (!updated.keywordsSelected?.length) updated.keywordsSelected = jdKeywords.slice(0, 8)

      if (!updated.achievements) updated.achievements = "Improved performance by 25% by optimizing X; Reduced costs by 15% through Y"

      setForm(updated)
    } finally {
      setLoading(false)
    }
  }

  const toggleKeyword = (kw: string) => {
    setForm((prev) => {
      const has = prev.keywordsSelected.includes(kw)
      return { ...prev, keywordsSelected: has ? prev.keywordsSelected.filter((k) => k !== kw) : [...prev.keywordsSelected, kw] }
    })
  }

  function generateBulletsFromContext(type: "experience" | "projects") {
    const verbs = ["Led", "Built", "Designed", "Developed", "Optimized", "Implemented", "Automated", "Improved", "Reduced", "Delivered"]
    const objs = jdSkills.length ? jdSkills.slice(0, 6) : ["systems", "features", "pipelines", "dashboards"]
    const metrics = ["10%", "20%", "30%", "2x", "3x"]
    const lines: string[] = []
    const count = 4
    for (let i = 0; i < count; i++) {
      const v = verbs[i % verbs.length]
      const o = objs[i % objs.length]
      const m = metrics[i % metrics.length]
      const kw = jdKeywords[i % (jdKeywords.length || 1)] || "impact"
      if (type === "experience") {
        lines.push(`${v} ${o} using ${kw}, improving performance by ${m}.`)
      } else {
        lines.push(`${v} a ${o} project leveraging ${kw}; achieved ${m} improvement.`)
      }
    }
    return "- " + lines.join("\n- ")
  }

  const handleGenExperience = () => {
    const bullets = generateBulletsFromContext("experience")
    setForm((prev) => ({ ...prev, experience: prev.experience ? prev.experience + "\n" + bullets : bullets }))
  }

  const handleGenProjects = () => {
    const bullets = generateBulletsFromContext("projects")
    setForm((prev) => ({ ...prev, projects: prev.projects ? prev.projects + "\n" + bullets : bullets }))
  }

  function removeBuzzwords(text: string): string {
    let t = text
    for (const b of BUZZWORDS) {
      const re = new RegExp(`\\b${b.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "gi")
      t = t.replace(re, "")
    }
    return t.replace(/\s{2,}/g, " ").trim()
  }

  function trimLongBullets(text: string): string {
    return text
      .split(/\n/)
      .map((l) => (l.length > 180 ? l.slice(0, 175) + "…" : l))
      .join("\n")
  }

  const handleApplySuggestions = () => {
    setApplying(true)
    try {
      // Expand summary if short
      let summary = form.summary
      if (summary.trim().length < 30) {
        const keySkills = jdSkills.slice(0, 3).join(", ")
        summary = `Experienced ${form.titleTarget || currentJobDescription?.title || "professional"} with strengths in ${keySkills}. Led initiatives with measurable impact.`
      }

      // Merge selected keywords into skills
      const skillsSet = new Set(parsedSkills)
      for (const k of form.keywordsSelected) {
        if (k && k.length > 2) skillsSet.add(k)
      }
      let skills = Array.from(skillsSet).join(", ")

      // Clean and trim bullets
      let experience = trimLongBullets(removeBuzzwords(form.experience))
      let projects = trimLongBullets(removeBuzzwords(form.projects))

      // Nudge quantification by appending metric if line lacks numbers
      const addMetric = (block: string) =>
        block
          .split(/\n/)
          .map((l) => (l.trim().startsWith("-") && !/(\d+%|\b\d+\b)/.test(l) ? l + " (e.g., +20%)" : l))
          .join("\n")

      experience = addMetric(experience)
      projects = addMetric(projects)

      setForm((prev) => ({ ...prev, summary, skills, experience, projects }))
    } finally {
      setApplying(false)
    }
  }

  const handleUseThis = () => {
    if (builderDisabled) return
    const text = makeResumeText(form)
    onGenerated(text)
    window.dispatchEvent(new CustomEvent("ats:go-optimize"))
  }

  // Live ATS readiness metrics
  const contactOk = (form.email && isValidEmail(form.email)) || form.phone.trim().length >= 7
  const summaryOk = form.summary.trim().length >= 30
  const skillsOk = parsedSkills.length >= 3
  const expOrProjOk = expValid || projectsValid
  const linksOk = !!(form.linkedin || form.github || form.portfolio)
  const keywordCoverage = useMemo(() => {
    const userTokens = new Set([...
      (form.keywordsSelected || []),
      ...parsedSkills,
      ...((form.experience + " " + form.projects + " " + form.summary).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)),
    ].map((s) => s.toString().toLowerCase()))
    const covered = jdKeywords.filter((k) => userTokens.has(k.toLowerCase())).length
    const total = jdKeywords.length || 1
    return Math.round((covered / total) * 100)
  }, [jdKeywords, form.keywordsSelected, parsedSkills, form.experience, form.projects, form.summary])

  const checker = useMemo(() => runResumeChecks(makeResumeText(form), currentJobDescription?.content || ""), [form, currentJobDescription])
  const overall = Math.round(
    (contactOk ? 1 : 0) * 15 +
      (summaryOk ? 1 : 0) * 20 +
      (skillsOk ? 1 : 0) * 20 +
      (expOrProjOk ? 1 : 0) * 20 +
      (linksOk ? 1 : 0) * 5 +
      keywordCoverage * 0.2,
  )

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="font-serif">Build Resume Manually</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-2">
          {/* Contact & Target Role */}
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <h4 className="font-semibold">Contact & Target</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-1">
                <Label>Name</Label>
                <Input className={fieldClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-invalid={form.name !== "" && form.name.trim().length < 2} />
                {form.name !== "" && form.name.trim().length < 2 && (
                  <p className="text-xs text-destructive">Please enter your full name.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input className={fieldClass} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-invalid={form.email !== "" && !isValidEmail(form.email)} />
                {form.email !== "" && !isValidEmail(form.email) && <p className="text-xs text-destructive">Enter a valid email or provide phone.</p>}
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input className={fieldClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label>Target Role</Label>
                <Input className={fieldClass} placeholder={currentJobDescription?.title || "e.g., Senior Frontend Engineer"} value={form.titleTarget} onChange={(e) => setForm({ ...form, titleTarget: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <h4 className="font-semibold">Links</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>LinkedIn</Label>
                <Input className={fieldClass} placeholder="https://linkedin.com/in/username" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>GitHub</Label>
                <Input className={fieldClass} placeholder="https://github.com/username" value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Portfolio</Label>
                <Input className={fieldClass} placeholder="https://your-portfolio.com" value={form.portfolio} onChange={(e) => setForm({ ...form, portfolio: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Summary & Keywords */}
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <h4 className="font-semibold">Summary & ATS Keywords</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Professional Summary</Label>
                <Textarea className={`min-h-24 ${fieldClass}`} placeholder="One paragraph summary aligning to the JD, with 2-3 key achievements." value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} aria-invalid={summaryInvalid} />
                {summaryInvalid && <p className="text-xs text-destructive">Please write at least 30 characters.</p>}
              </div>
              <div className="space-y-2">
                <Label>ATS Keywords (from JD)</Label>
                <div className="flex flex-wrap gap-3 p-3 rounded-md border bg-muted/30 max-h-48 overflow-auto">
                  {jdKeywords.map((kw) => (
                    <label key={kw} className="inline-flex items-center gap-2 text-sm">
                      <Checkbox checked={form.keywordsSelected.includes(kw)} onCheckedChange={() => toggleKeyword(kw)} />
                      <span>{kw}</span>
                    </label>
                  ))}
                  {!jdKeywords.length && <p className="text-xs text-muted-foreground">No keywords detected. Add manually below.</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <h4 className="font-semibold">Skills</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Technical Skills (comma separated)</Label>
                <Textarea className={`min-h-24 ${fieldClass}`} placeholder={jdSkills.join(", ")} value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} aria-invalid={skillsInvalid} />
                {skillsInvalid && <p className="text-xs text-destructive">Please include at least 3 skills.</p>}
              </div>
              <div className="space-y-2">
                <Label>Soft Skills (comma separated)</Label>
                <Textarea className={`min-h-24 ${fieldClass}`} value={form.softSkills} onChange={(e) => setForm({ ...form, softSkills: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Tools & Certifications */}
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <h4 className="font-semibold">Tools & Certifications</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tools & Technologies</Label>
                <Textarea className={`min-h-20 ${fieldClass}`} value={form.tools} onChange={(e) => setForm({ ...form, tools: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Certifications</Label>
                <Textarea className={`min-h-20 ${fieldClass}`} value={form.certifications} onChange={(e) => setForm({ ...form, certifications: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Experience, Education, Projects */}
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Experience & Education</h4>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleGenExperience}>Generate Experience Bullets</Button>
                <Button variant="outline" size="sm" onClick={handleGenProjects}>Generate Project Bullets</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Experience</Label>
              <Textarea className={`min-h-32 ${fieldClass}`} placeholder="Company — Role (YYYY–YYYY)\n- Achievement with metric\n- Responsibility with keyword" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
              {!expValid && !projectsValid && <p className="text-xs text-destructive">Provide either Experience or Projects with at least 30 characters.</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Education</Label>
                <Textarea className={`min-h-20 ${fieldClass}`} value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Projects</Label>
                <Textarea className={`min-h-20 ${fieldClass}`} value={form.projects} onChange={(e) => setForm({ ...form, projects: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Achievements & Misc */}
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <h4 className="font-semibold">Achievements & Misc</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Key Achievements (comma or newline separated)</Label>
                <Textarea className={`min-h-20 ${fieldClass}`} value={form.achievements} onChange={(e) => setForm({ ...form, achievements: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Languages</Label>
                <Input className={fieldClass} placeholder="English (Native), Spanish (Professional)" value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <div className="space-y-2">
                    <Label>Work Authorization</Label>
                    <Input className={fieldClass} placeholder="e.g., US Citizen, H1B" value={form.authorization} onChange={(e) => setForm({ ...form, authorization: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Availability</Label>
                    <Input className={fieldClass} placeholder="e.g., 2 weeks notice, Immediate" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Location</Label>
                    <Input className={fieldClass} placeholder="City, State (Open to Remote)" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Button variant="outline" onClick={aiAssist} disabled={loading}>
              <Sparkles className="h-4 w-4 mr-2" />
              {loading ? "Suggesting..." : "AI Assist"}
            </Button>
            <Button variant="outline" onClick={handleApplySuggestions} disabled={applying}>
              {applying ? "Applying..." : "Apply Suggestions"}
            </Button>
            <Button onClick={handleUseThis} disabled={builderDisabled} aria-disabled={builderDisabled}>Use This</Button>
            {currentResume ? (
              <Badge variant="secondary" className="ml-auto">Using uploaded resume as context</Badge>
            ) : null}
          </div>
        </div>

        {/* ATS Readiness Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ATS Readiness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Overall</span>
                  <span>{overall}%</span>
                </div>
                <Progress value={overall} />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Contact Info</span>
                  <Badge variant={contactOk ? "secondary" : "destructive"}>{contactOk ? "OK" : "Missing"}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Summary Length</span>
                  <Badge variant={summaryOk ? "secondary" : "destructive"}>{summaryOk ? "OK" : "Short"}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Skills Count</span>
                  <Badge variant={skillsOk ? "secondary" : "destructive"}>{parsedSkills.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Experience/Projects</span>
                  <Badge variant={expOrProjOk ? "secondary" : "destructive"}>{expOrProjOk ? "OK" : "Add"}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Keyword Coverage</span>
                  <Badge variant={keywordCoverage >= 50 ? "secondary" : "destructive"}>{keywordCoverage}%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resume Checker</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Checker Score</span>
                  <span>{checker.score}%</span>
                </div>
                <Progress value={checker.score} />
              </div>
              <div className="space-y-2 text-sm">
                {checker.checks.filter((c) => !c.pass).slice(0, 6).map((c) => (
                  <div key={c.id} className="p-2 rounded-md border bg-muted/30">
                    <div className="font-medium">{c.label}</div>
                    {c.suggestion ? <div className="text-xs text-muted-foreground">{c.suggestion}</div> : null}
                  </div>
                ))}
                {checker.checks.filter((c) => !c.pass).length === 0 && (
                  <p className="text-xs text-muted-foreground">Looking good! No major issues found.</p>
                )}
              </div>
            </CardContent>
          </Card>
          <AIAssistant
            jobDescription={currentJobDescription?.content || ""}
            onApply={(target, newText) => {
              if (target === "summary") setForm((prev) => ({ ...prev, summary: newText }))
              else if (target === "experience") setForm((prev) => ({ ...prev, experience: newText }))
              else if (target === "projects") setForm((prev) => ({ ...prev, projects: newText }))
              else if (target === "skills") setForm((prev) => ({ ...prev, skills: newText }))
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
} 