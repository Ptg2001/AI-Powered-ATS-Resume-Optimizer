"use client"

import { AuthProvider, useAuth } from "@/components/auth-provider"
import { AuthForm } from "@/components/auth-form"
import { AppHeader } from "@/components/app-header"
import { ResumeUpload } from "@/components/resume-upload"
import { JobDescriptionInput } from "@/components/job-description-input"
import { SkillConfirmation } from "@/components/skill-confirmation"
import { AnalysisResults } from "@/components/analysis-results"
import { ATSDashboard } from "@/components/ats-dashboard"
import { TemplateSelector } from "@/components/template-selector"
import { ManualResumeBuilder } from "@/components/manual-resume-builder"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, BarChart3, Download, History, ArrowRight, Sparkles, Layout } from "lucide-react"
import { useATSStore } from "@/lib/store"
import { analyzeResumeWithAI, generateSkillConfirmationList } from "@/lib/ai-analysis"
import { useEffect, useMemo, useState } from "react"
import type { UserSkillConfirmation, AnalysisResult } from "@/lib/ai-analysis"
import type { ATSAnalysis } from "@/lib/store"
import { ensureSignedIn, loadAllFromCloud, saveAnalysisToCloud, aiChat, saveOptimizedResumeToCloud } from "@/lib/puter"
import { exportTextAsDocx, exportTextAsPdf, exportTextAsTxt } from "@/lib/export-utils"
import { formatDate, toIsoString } from "@/lib/utils"

function Dashboard() {
  const {
    currentResume,
    currentJobDescription,
    jobDescriptions,
    setCurrentJobDescription,
    resumes,
    analyses,
    addAnalysis,
    setCurrentAnalysis,
    hydrateFromCloud,
    selectedTemplate,
  } = useATSStore()

  const [analysisStep, setAnalysisStep] = useState<"ready" | "confirming" | "analyzing" | "complete">("ready")
  const [skillConfirmationList, setSkillConfirmationList] = useState<UserSkillConfirmation[]>([])
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const [optimizedResume, setOptimizedResume] = useState<string>("")
  const [isOptimizing, setIsOptimizing] = useState(false)
  // Ensure optimized content only renders on client
  const [isClient, setIsClient] = useState(false)
  useEffect(() => setIsClient(true), [])

  const [activeTab, setActiveTab] = useState<string>(analyses.length > 0 ? "dashboard" : "upload")

  const canAnalyze = useMemo(() => !!(currentResume && currentJobDescription), [currentResume, currentJobDescription])
  const canOptimize = useMemo(() => !!(currentResume && currentJobDescription), [currentResume, currentJobDescription])

  useEffect(() => {
    ;(async () => {
      await ensureSignedIn()
      const data = await loadAllFromCloud().catch(() => null)
      if (data) hydrateFromCloud(data)
    })()
  }, [hydrateFromCloud])

  useEffect(() => {
    if (!analyses.length && activeTab === "dashboard") setActiveTab("upload")
  }, [analyses.length, activeTab])

  useEffect(() => {
    const handler = () => setActiveTab("optimize")
    window.addEventListener("ats:go-optimize", handler)
    return () => window.removeEventListener("ats:go-optimize", handler)
  }, [])

  const startAnalysis = async () => {
    if (!currentResume || !currentJobDescription) return

    setIsAnalyzing(true)
    setAnalysisStep("analyzing")

    try {
      const result = await analyzeResumeWithAI(
        currentResume.extractedText || currentResume.content,
        currentJobDescription.content,
      )

      const skillList = generateSkillConfirmationList(result.skillMatches)
      setSkillConfirmationList(skillList)
      setAnalysisStep("confirming")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSkillConfirmation = async (confirmedSkills: UserSkillConfirmation[]) => {
    if (!currentResume || !currentJobDescription) return

    setIsAnalyzing(true)
    setAnalysisStep("analyzing")

    try {
      const result = await analyzeResumeWithAI(
        currentResume.extractedText || currentResume.content,
        currentJobDescription.content,
      )

      const updatedResult = {
        ...result,
        matchedSkills: confirmedSkills.filter((s) => s.hasSkill).map((s) => s.skill),
        missingSkills: confirmedSkills.filter((s) => !s.hasSkill).map((s) => s.skill),
      }

      setAnalysisResult(updatedResult)

      const analysis: ATSAnalysis = {
        id: Date.now().toString(),
        resumeId: currentResume.id,
        jobDescriptionId: currentJobDescription.id,
        score: updatedResult.score.overall,
        matchedSkills: updatedResult.matchedSkills,
        missingSkills: updatedResult.missingSkills,
        weakSkills: updatedResult.weakSkills,
        recommendations: updatedResult.recommendations,
        createdAt: new Date(),
      }

      addAnalysis(analysis)
      setCurrentAnalysis(analysis)
      saveAnalysisToCloud({ ...analysis, createdAt: toIsoString(analysis.createdAt) }).catch(() => {})
      setAnalysisStep("complete")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateOptimizedResume = async () => {
    if (!currentResume || !currentJobDescription) return
    setIsOptimizing(true)
    try {
      const resumeText = currentResume.extractedText || currentResume.content
      const jd = currentJobDescription.content
      let text = ""
      try {
        // Try AI first if available
        // @ts-expect-error global
        const puter = typeof window !== "undefined" ? window.puter : undefined
        if (puter?.ai?.chat) {
          const prompt = `Rewrite the resume in the same structure but with corrections and JD alignment.\nKeep sections (Summary, Skills, Experience, Education, Projects). Ensure ATS-friendly formatting.\nReturn plain text only.\n\nCURRENT RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jd}`
          text = await aiChat(prompt)
        }
      } catch (_) {
        // ignore and fallback
      }
      if (!text) {
        // Heuristic fallback: keep structure, add JD-aligned summary and deduplicate whitespace
        const summarize = (s: string) => s.replace(/\s+/g, " ").trim()
        const summaryLine = `Summary\nExperienced professional aligning to ${currentJobDescription.title} at ${currentJobDescription.company}. Emphasize relevant achievements and keywords from the job description.`
        const hasSummary = /\bsummary\b/i.test(resumeText)
        const optimized = [
          hasSummary ? "" : summaryLine,
          summarize(resumeText),
        ]
          .filter(Boolean)
          .join("\n\n")
        text = optimized
      }
      setOptimizedResume(text)
      saveOptimizedResumeToCloud({ resumeId: currentResume.id, jobId: currentJobDescription.id, content: text }).catch(
        () => {},
      )
    } finally {
      setIsOptimizing(false)
    }
  }

  const jobSwitcher = (
    <div className="flex items-center gap-2">
      <Select
        value={currentJobDescription?.id || ""}
        onValueChange={(val) => {
          if (val === "__new__") {
            setCurrentJobDescription(null)
            setActiveTab("analyze")
            return
          }
          const found = jobDescriptions.find((j) => j.id === val)
          if (found) setCurrentJobDescription(found)
        }}
      >
        <SelectTrigger className="w-[260px]">
          <SelectValue placeholder="Select Job Description" />
        </SelectTrigger>
        <SelectContent>
          {jobDescriptions.map((j) => (
            <SelectItem key={j.id} value={j.id}>
              {j.title} — {j.company}
            </SelectItem>
          ))}
          <SelectItem value="__new__">+ Add new...</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" onClick={() => setActiveTab("analyze")} disabled={!currentJobDescription}>
        Use Selected
      </Button>
      {currentJobDescription ? (
        <Button variant="destructive" size="sm" onClick={() => setCurrentJobDescription(null)}>
          Remove
        </Button>
      ) : null}
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-serif font-bold text-foreground mb-2">Your ATS Workspace</h2>
            <p className="text-muted-foreground">Upload, analyze, optimize, and export resumes with AI assistance</p>
          </div>
          {jobDescriptions.length > 0 ? jobSwitcher : null}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="analyze" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Analyze
            </TabsTrigger>
            <TabsTrigger value="template" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="creator" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Creator
            </TabsTrigger>
            <TabsTrigger value="optimize" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Optimize
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {analyses.length > 0 || resumes.length > 0 ? (
              <ATSDashboard />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Welcome to Your ATS Dashboard</CardTitle>
                  <CardDescription>Start by uploading a resume and analyzing it against job descriptions to see your dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No data available yet</p>
                    <p className="text-sm mb-4">Upload a resume and run an analysis to see your performance metrics</p>
                    <Button onClick={() => setActiveTab("upload")}>Get Started</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className={`hover:shadow-md transition-shadow ${currentResume ? "ring-2 ring-primary/20" : ""}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upload Resume</CardTitle>
                  <Upload className={`h-4 w-4 ${currentResume ? "text-primary" : "text-muted-foreground"}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${currentResume ? "text-primary" : "text-primary"}`}>
                    {currentResume ? "✓" : "Step 1"}
                  </div>
                  <p className="text-xs text-muted-foreground">{currentResume ? "Resume uploaded" : "Upload your current resume"}</p>
                </CardContent>
              </Card>

              <Card className={`hover:shadow-md transition-shadow ${currentJobDescription ? "ring-2 ring-primary/20" : ""}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Job Description</CardTitle>
                  <FileText className={`h-4 w-4 ${currentJobDescription ? "text-primary" : "text-muted-foreground"}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${currentJobDescription ? "text-primary" : "text-primary"}`}>
                    {currentJobDescription ? "✓" : "Step 2"}
                  </div>
                  <p className="text-xs text-muted-foreground">{currentJobDescription ? "Job description added" : "Add target job description"}</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ATS Analysis</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">Step 3</div>
                  <p className="text-xs text-muted-foreground">Get AI-powered insights</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Optimized Resume</CardTitle>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">Step 4</div>
                  <p className="text-xs text-muted-foreground">Download optimized version</p>
                </CardContent>
              </Card>
            </div>

            <ResumeUpload />

            {currentResume && (
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="font-serif flex items-center gap-2">
                    <ArrowRight className="h-5 w-5 text-primary" />
                    Next Step: Add Job Description
                  </CardTitle>
                  <CardDescription>Your resume is ready! Now add a job description to start the analysis.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setActiveTab("analyze")} className="w-full">
                    Continue to Job Description
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analyze" className="space-y-6">
            {!currentResume ? (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">ATS Analysis</CardTitle>
                  <CardDescription>Upload a resume first to start the analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Please upload a resume first</p>
                    <Button className="mt-4" onClick={() => setActiveTab("upload")}>Go to Upload</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {analysisStep === "ready" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <Card className="border-primary/20">
                        <CardHeader>
                          <CardTitle className="font-serif text-lg">Resume Ready</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-primary/10 rounded">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{currentResume.name}</p>
                              <p className="text-sm text-muted-foreground">Ready for analysis</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className={currentJobDescription ? "border-primary/20" : ""}>
                        <CardHeader>
                          <CardTitle className="font-serif text-lg">
                            {currentJobDescription ? "Job Description Added" : "Add Job Description"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {currentJobDescription ? (
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-primary/10 rounded">
                                <FileText className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{currentJobDescription.title}</p>
                                <p className="text-sm text-muted-foreground">{currentJobDescription.company}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-muted-foreground">Add a job description to continue</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {!currentJobDescription && <JobDescriptionInput />}

                    {currentResume && currentJobDescription && (
                      <Card className="border-primary/20">
                        <CardHeader>
                          <CardTitle className="font-serif flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Ready for AI Analysis
                          </CardTitle>
                          <CardDescription>Both resume and job description are ready. Start the AI-powered analysis!</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button onClick={startAnalysis} className="w-full" size="lg" disabled={isAnalyzing || !canAnalyze}>
                            {isAnalyzing ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Analyzing with AI...
                              </>
                            ) : (
                              <>
                                <BarChart3 className="mr-2 h-4 w-4" />
                                Start ATS Analysis
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}

                {analysisStep === "confirming" && (
                  <SkillConfirmation skills={skillConfirmationList} onConfirm={handleSkillConfirmation} isLoading={isAnalyzing} />
                )}

                {analysisStep === "analyzing" && (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">AI Analysis in Progress</h3>
                        <p className="text-muted-foreground">Our AI is analyzing your resume against the job description...</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {analysisStep === "complete" && analysisResult && currentJobDescription && (
                  <AnalysisResults
                    analysis={analysisResult}
                    resumeName={currentResume.name}
                    jobTitle={currentJobDescription.title}
                    company={currentJobDescription.company}
                  />
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="template" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Choose a Template</CardTitle>
                <CardDescription>Select a resume template for export</CardDescription>
              </CardHeader>
              <CardContent>
                <TemplateSelector onContinue={() => setActiveTab("optimize")} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="creator" className="space-y-6">
            <ManualResumeBuilder onGenerated={(text) => setOptimizedResume(text)} />
          </TabsContent>

          <TabsContent value="optimize">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Resume Optimization</CardTitle>
                <CardDescription>
                  {selectedTemplate ? `Using template: ${selectedTemplate}` : "Select a template for best results"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!canOptimize ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Upload a resume and add a job description first</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                      <Button onClick={generateOptimizedResume} disabled={isOptimizing || !canOptimize}>
                        {isOptimizing ? "Generating..." : "Generate Corrections"}
                      </Button>
                      <Button
                        variant="outline"
                        disabled={!optimizedResume}
                        onClick={() => exportTextAsDocx("Optimized_Resume", "Optimized Resume", optimizedResume)}
                      >
                        Export DOCX
                      </Button>
                      <Button variant="outline" disabled={!optimizedResume} onClick={() => exportTextAsPdf("Optimized_Resume", "Optimized Resume", optimizedResume)}>
                        Export PDF
                      </Button>
                      <Button variant="outline" disabled={!optimizedResume} onClick={() => exportTextAsTxt("Optimized_Resume", optimizedResume)}>
                        Export TXT
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="font-serif text-lg">Original</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="p-3 bg-muted/30 rounded-lg max-h-[500px] overflow-y-auto whitespace-pre-wrap text-sm">
                            {currentResume.extractedText || currentResume.content}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="font-serif text-lg">Optimized</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="p-3 bg-muted/30 rounded-lg max-h-[500px] overflow-y-auto whitespace-pre-wrap text-sm">
                            {isClient ? (optimizedResume || "Click Generate Corrections to create a tailored version.") : ""}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Analysis History</CardTitle>
                <CardDescription>View your past resume analyses and optimizations</CardDescription>
              </CardHeader>
              <CardContent>
                {resumes.length > 0 ? (
                  <div className="space-y-4">
                    {resumes.map((resume) => (
                      <div key={resume.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{resume.name}</p>
                            <p className="text-sm text-muted-foreground">Uploaded {formatDate(resume.uploadedAt)}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">View Details</Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No resume history yet</p>
                    <p className="text-sm">Upload a resume to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return user ? <Dashboard /> : <AuthForm />
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
