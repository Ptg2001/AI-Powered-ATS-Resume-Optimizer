"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, AlertTriangle, Lightbulb, TrendingUp, Target, Award } from "lucide-react"
import type { AnalysisResult } from "@/lib/ai-analysis"

interface AnalysisResultsProps {
  analysis: AnalysisResult
  resumeName: string
  jobTitle: string
  company: string
}

export function AnalysisResults({ analysis, resumeName, jobTitle, company }: AnalysisResultsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreVariant = (score: number) => {
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    return "destructive"
  }

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            ATS Compatibility Score
          </CardTitle>
          <CardDescription>
            Analysis of {resumeName} for {jobTitle} at {company}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center mb-6">
            <div className="text-center">
              <div className={`text-6xl font-bold ${getScoreColor(analysis.score.overall)}`}>
                {analysis.score.overall}
              </div>
              <div className="text-lg text-muted-foreground">out of 100</div>
              <Badge variant={getScoreVariant(analysis.score.overall)} className="mt-2">
                {analysis.score.overall >= 80
                  ? "Excellent"
                  : analysis.score.overall >= 60
                    ? "Good"
                    : "Needs Improvement"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{analysis.score.skillsMatch}%</div>
              <div className="text-sm text-muted-foreground">Skills Match</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{analysis.score.keywordsMatch}%</div>
              <div className="text-sm text-muted-foreground">Keywords</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{analysis.score.experienceRelevance}%</div>
              <div className="text-sm text-muted-foreground">Experience</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{analysis.score.formatScore}%</div>
              <div className="text-sm text-muted-foreground">Format</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="skills" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
          <TabsTrigger value="gaps">Skill Gaps</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Matched Skills ({analysis.matchedSkills.length})
              </CardTitle>
              <CardDescription>Skills found in both your resume and the job description</CardDescription>
            </CardHeader>
            <CardContent>
              {analysis.matchedSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {analysis.matchedSkills.map((skill, index) => (
                    <Badge key={index} variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No matching skills found. Consider adding relevant skills to your resume.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Missing Skills ({analysis.missingSkills.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.missingSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analysis.missingSkills.slice(0, 8).map((skill, index) => (
                      <Badge key={index} variant="destructive" className="bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        {skill}
                      </Badge>
                    ))}
                    {analysis.missingSkills.length > 8 && (
                      <Badge variant="outline">+{analysis.missingSkills.length - 8} more</Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Great! No critical skills are missing.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  Weak Skills ({analysis.weakSkills.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.weakSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analysis.weakSkills.slice(0, 6).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {skill}
                      </Badge>
                    ))}
                    {analysis.weakSkills.length > 6 && (
                      <Badge variant="outline">+{analysis.weakSkills.length - 6} more</Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">All matched skills appear strong.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gaps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Skill Gap Analysis
              </CardTitle>
              <CardDescription>Areas where your resume could be strengthened</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Skills Coverage</span>
                    <span className="text-sm text-muted-foreground">{analysis.score.skillsMatch}%</span>
                  </div>
                  <Progress value={analysis.score.skillsMatch} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Keyword Optimization</span>
                    <span className="text-sm text-muted-foreground">{analysis.score.keywordsMatch}%</span>
                  </div>
                  <Progress value={analysis.score.keywordsMatch} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Experience Relevance</span>
                    <span className="text-sm text-muted-foreground">{analysis.score.experienceRelevance}%</span>
                  </div>
                  <Progress value={analysis.score.experienceRelevance} className="h-2" />
                </div>

                {analysis.missingSkills.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Priority Skills to Add:</strong> Focus on adding{" "}
                      {analysis.missingSkills.slice(0, 3).join(", ")}
                      to significantly improve your ATS score.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                AI Recommendations
              </CardTitle>
              <CardDescription>Personalized suggestions to improve your resume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                      {index + 1}
                    </div>
                    <p className="text-sm">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Keyword Analysis
              </CardTitle>
              <CardDescription>Important keywords from the job description</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Top Keywords to Include</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(analysis.keywordDensity).map(([keyword, count]) => (
                      <Badge key={keyword} variant="outline" className="text-xs">
                        {keyword} ({count})
                      </Badge>
                    ))}
                  </div>
                </div>

                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Tip:</strong> Include these keywords naturally throughout your resume, especially in your
                    summary, skills section, and work experience descriptions.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
