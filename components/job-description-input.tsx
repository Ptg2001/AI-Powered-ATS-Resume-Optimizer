"use client"

import type React from "react"

import { useState, useCallback, useMemo } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Upload, Briefcase, X, CheckCircle, AlertCircle, Sparkles } from "lucide-react"
import { useATSStore } from "@/lib/store"
import { validateFile, extractTextFromFile, generateFileId } from "@/lib/file-utils"
import type { JobDescription } from "@/lib/store"
import { saveJobToCloud } from "@/lib/puter"
import { formatDate, toIsoString } from "@/lib/utils"

export function JobDescriptionInput() {
  const { addJobDescription, currentJobDescription, setCurrentJobDescription } = useATSStore()

  const [manualInput, setManualInput] = useState({
    title: "",
    company: "",
    content: "",
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const manualInvalid = useMemo(() => {
    return (
      manualInput.title.trim().length < 2 ||
      manualInput.company.trim().length < 2 ||
      manualInput.content.trim().length < 30
    )
  }, [manualInput])

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (manualInvalid) {
      setError("Please fill in all fields (content at least 30 characters)")
      return
    }

    setIsProcessing(true)

    try {
      const extractedSkills = await extractSkillsFromText(manualInput.content)
      const extractedKeywords = await extractKeywordsFromText(manualInput.content)

      const jobDescription: JobDescription = {
        id: generateFileId(),
        title: manualInput.title.trim(),
        company: manualInput.company.trim(),
        content: manualInput.content.trim(),
        createdAt: new Date(),
        extractedSkills,
        extractedKeywords,
      }

      addJobDescription(jobDescription)
      saveJobToCloud({
        ...jobDescription,
        createdAt: toIsoString(jobDescription.createdAt),
      }).catch(() => {})

      setSuccess(`Job description for ${manualInput.title} at ${manualInput.company} has been added successfully`)
      setManualInput({ title: "", company: "", content: "" })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to process job description"
      setError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const processUploadedFile = async (file: File) => {
    setError(null)
    setSuccess(null)
    setIsProcessing(true)

    try {
      const validation = validateFile(file)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      const extractedText = await extractTextFromFile(file)

      const fileName = file.name.replace(/\.[^/.]+$/, "")
      const title = extractJobTitleFromText(extractedText) || fileName
      const company = extractCompanyFromText(extractedText) || "Unknown Company"

      const extractedSkills = await extractSkillsFromText(extractedText)
      const extractedKeywords = await extractKeywordsFromText(extractedText)

      const jobDescription: JobDescription = {
        id: generateFileId(),
        title,
        company,
        content: extractedText,
        createdAt: new Date(),
        extractedSkills,
        extractedKeywords,
      }

      addJobDescription(jobDescription)
      saveJobToCloud({
        ...jobDescription,
        createdAt: toIsoString(jobDescription.createdAt),
      }).catch(() => {})

      setSuccess(`Job description uploaded and processed successfully`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed"
      setError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processUploadedFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/plain": [".txt"],
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    disabled: isProcessing,
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Add Job Description
          </CardTitle>
          <CardDescription>Add the job description you want to optimize your resume for</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Input</TabsTrigger>
              <TabsTrigger value="upload">Upload File</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4">
              <form onSubmit={handleManualSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="job-title">Job Title *</Label>
                    <Input
                      id="job-title"
                      placeholder="e.g., Senior Software Engineer"
                      value={manualInput.title}
                      onChange={(e) => setManualInput({ ...manualInput, title: e.target.value })}
                      required
                      aria-invalid={manualInput.title !== "" && manualInput.title.trim().length < 2}
                    />
                    {manualInput.title !== "" && manualInput.title.trim().length < 2 && (
                      <p className="text-xs text-destructive">Please enter a valid job title.</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company *</Label>
                    <Input
                      id="company"
                      placeholder="e.g., Google, Microsoft, etc."
                      value={manualInput.company}
                      onChange={(e) => setManualInput({ ...manualInput, company: e.target.value })}
                      required
                      aria-invalid={manualInput.company !== "" && manualInput.company.trim().length < 2}
                    />
                    {manualInput.company !== "" && manualInput.company.trim().length < 2 && (
                      <p className="text-xs text-destructive">Please enter a valid company name.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job-content">Job Description *</Label>
                  <Textarea
                    id="job-content"
                    placeholder="Paste the complete job description here..."
                    className="min-h-[200px]"
                    value={manualInput.content}
                    onChange={(e) => setManualInput({ ...manualInput, content: e.target.value })}
                    required
                    aria-invalid={manualInput.content !== "" && manualInput.content.trim().length < 30}
                  />
                  {manualInput.content !== "" && manualInput.content.trim().length < 30 && (
                    <p className="text-xs text-destructive">Please provide at least 30 characters.</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Include requirements, responsibilities, and preferred qualifications for best results
                  </p>
                </div>

                <Button type="submit" disabled={isProcessing || manualInvalid} aria-disabled={isProcessing || manualInvalid} className="w-full">
                  {isProcessing ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze Job Description
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
                  ${isProcessing ? "pointer-events-none opacity-50" : ""}
                `}
              >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>

                  {isDragActive ? (
                    <div>
                      <p className="text-lg font-medium">Drop job description here</p>
                      <p className="text-sm text-muted-foreground">Release to upload</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-medium">Upload job description file</p>
                      <p className="text-sm text-muted-foreground">or drag & drop here</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="secondary" className="text-xs">
                      TXT
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      PDF
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      DOCX
                    </Badge>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {currentJobDescription && <JobDescriptionPreview jobDescription={currentJobDescription} />}
    </div>
  )
}

function JobDescriptionPreview({ jobDescription }: { jobDescription: JobDescription }) {
  const { setCurrentJobDescription, removeJobDescription, updateJobDescription } = useATSStore()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [form, setForm] = useState({ title: jobDescription.title, company: jobDescription.company, content: jobDescription.content })
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const handleRemove = () => {
    removeJobDescription(jobDescription.id)
  }

  const handleSave = async () => {
    setEditError(null)
    if (form.title.trim().length < 2 || form.company.trim().length < 2 || form.content.trim().length < 30) {
      setEditError("Please provide valid values (content at least 30 characters)")
      return
    }
    setSaving(true)
    try {
      const updated: JobDescription = {
        ...jobDescription,
        title: form.title.trim(),
        company: form.company.trim(),
        content: form.content,
      }
      updateJobDescription(updated)
      await saveJobToCloud({ ...updated, createdAt: toIsoString(updated.createdAt) }).catch(() => {})
      setIsEditOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Current Job Description
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">Edit</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Job Description</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Job Title</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea className="min-h-[200px]" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
                  </div>
                  {editError ? <p className="text-sm text-destructive">{editError}</p> : null}
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="destructive" size="sm" onClick={handleRemove}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Position</Label>
              <p className="font-medium">{jobDescription.title}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Company</Label>
              <p className="font-medium">{jobDescription.company}</p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Added</Label>
            <p className="text-sm">{formatDate(jobDescription.createdAt)}</p>
          </div>

          {jobDescription.extractedSkills && jobDescription.extractedSkills.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                Extracted Skills ({jobDescription.extractedSkills.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {jobDescription.extractedSkills.slice(0, 10).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {jobDescription.extractedSkills.length > 10 && (
                  <Badge variant="outline" className="text-xs">
                    +{jobDescription.extractedSkills.length - 10} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {jobDescription.extractedKeywords && jobDescription.extractedKeywords.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                Key Requirements ({jobDescription.extractedKeywords.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {jobDescription.extractedKeywords.slice(0, 8).map((keyword, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
                {jobDescription.extractedKeywords.length > 8 && (
                  <Badge variant="secondary" className="text-xs">
                    +{jobDescription.extractedKeywords.length - 8} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">Description Preview</Label>
            <div className="p-4 bg-muted/30 rounded-lg max-h-32 overflow-y-auto">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {jobDescription.content.substring(0, 300)}
                {jobDescription.content.length > 300 && "..."}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  View Full Description
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{jobDescription.title} — {jobDescription.company}</DialogTitle>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-auto whitespace-pre-wrap text-sm">
                  {jobDescription.content}
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Edit Details
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Job Description</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Job Title</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea className="min-h-[200px]" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
                  </div>
                  {editError ? <p className="text-sm text-destructive">{editError}</p> : null}
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper functions for text analysis
async function extractSkillsFromText(text: string): Promise<string[]> {
  // Basic skill extraction - in production would use AI/NLP
  const commonSkills = [
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "Python",
    "Java",
    "C++",
    "SQL",
    "MongoDB",
    "AWS",
    "Docker",
    "Kubernetes",
    "Git",
    "Agile",
    "Scrum",
    "REST API",
    "GraphQL",
    "HTML",
    "CSS",
    "Angular",
    "Vue.js",
    "Express",
    "Django",
    "Flask",
    "Spring",
    "PostgreSQL",
    "MySQL",
    "Redis",
    "Machine Learning",
    "Data Analysis",
    "Project Management",
    "Leadership",
    "Communication",
    "Problem Solving",
    "Team Collaboration",
    "Azure",
    "GCP",
    "CI/CD",
    "DevOps",
    "Linux",
    "Windows",
  ]

  const foundSkills = commonSkills.filter((skill) => text.toLowerCase().includes(skill.toLowerCase()))

  return [...new Set(foundSkills)].slice(0, 15) // Remove duplicates and limit
}

async function extractKeywordsFromText(text: string): Promise<string[]> {
  // Basic keyword extraction - in production would use AI/NLP
  const keywords = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .filter(
      (word) =>
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
        ].includes(word),
    )

  const wordCount = keywords.reduce(
    (acc, word) => {
      acc[word] = (acc[word] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 12)
    .map(([word]) => word)
}

function extractJobTitleFromText(text: string): string | null {
  // Basic job title extraction - look for common patterns
  const titlePatterns = [/job title[:\s]+([^\n\r]+)/i, /position[:\s]+([^\n\r]+)/i, /role[:\s]+([^\n\r]+)/i]

  for (const pattern of titlePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim().substring(0, 100)
    }
  }

  return null
}

function extractCompanyFromText(text: string): string | null {
  // Basic company extraction - look for common patterns
  const companyPatterns = [/company[:\s]+([^\n\r]+)/i, /organization[:\s]+([^\n\r]+)/i, /employer[:\s]+([^\n\r]+)/i]

  for (const pattern of companyPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim().substring(0, 100)
    }
  }

  return null
}
