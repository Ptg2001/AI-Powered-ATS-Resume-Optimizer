"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts"
import { TrendingUp, BarChart3, Target, Calendar, Award, ArrowUp, ArrowDown, Minus, Filter } from "lucide-react"
import { useATSStore } from "@/lib/store"
import { useState, useMemo } from "react"
import { formatDate } from "@/lib/utils"

interface DashboardData {
  date: string
  score: number
  skillsMatch: number
  keywordsMatch: number
  experienceRelevance: number
  formatScore: number
  jobTitle: string
  company: string
}

export function ATSDashboard() {
  const { analyses, resumes, jobDescriptions } = useATSStore()
  const [selectedTimeRange, setSelectedTimeRange] = useState("30")
  const [selectedMetric, setSelectedMetric] = useState("overall")

  // Generate mock historical data for demonstration
  const historicalData: DashboardData[] = useMemo(() => {
    const mockData: DashboardData[] = [
      {
        date: "2024-01-15",
        score: 65,
        skillsMatch: 60,
        keywordsMatch: 70,
        experienceRelevance: 65,
        formatScore: 85,
        jobTitle: "Frontend Developer",
        company: "TechCorp",
      },
      {
        date: "2024-01-20",
        score: 72,
        skillsMatch: 68,
        keywordsMatch: 75,
        experienceRelevance: 70,
        formatScore: 85,
        jobTitle: "React Developer",
        company: "StartupXYZ",
      },
      {
        date: "2024-01-25",
        score: 78,
        skillsMatch: 75,
        keywordsMatch: 80,
        experienceRelevance: 75,
        formatScore: 90,
        jobTitle: "Full Stack Developer",
        company: "BigTech",
      },
      {
        date: "2024-02-01",
        score: 82,
        skillsMatch: 80,
        keywordsMatch: 85,
        experienceRelevance: 80,
        formatScore: 90,
        jobTitle: "Senior Developer",
        company: "Enterprise Inc",
      },
      {
        date: "2024-02-05",
        score: 85,
        skillsMatch: 85,
        keywordsMatch: 88,
        experienceRelevance: 82,
        formatScore: 92,
        jobTitle: "Tech Lead",
        company: "Innovation Labs",
      },
    ]

    // Add real analyses data if available
    const realData = analyses.map((analysis) => {
      const resume = resumes.find((r) => r.id === analysis.resumeId)
      const job = jobDescriptions.find((j) => j.id === analysis.jobDescriptionId)

      return {
        date: formatDate(analysis.createdAt),
        score: analysis.score,
        skillsMatch: 75, // Mock data - would come from detailed analysis
        keywordsMatch: 70,
        experienceRelevance: 80,
        formatScore: 85,
        jobTitle: job?.title || "Unknown Position",
        company: job?.company || "Unknown Company",
      }
    })

    return [...mockData, ...realData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [analyses, resumes, jobDescriptions])

  const currentScore = historicalData.length > 0 ? historicalData[historicalData.length - 1].score : 0
  const previousScore = historicalData.length > 1 ? historicalData[historicalData.length - 2].score : currentScore
  const scoreChange = currentScore - previousScore

  const averageScore =
    historicalData.length > 0
      ? Math.round(historicalData.reduce((sum, data) => sum + data.score, 0) / historicalData.length)
      : 0

  const skillsBreakdownData =
    historicalData.length > 0
      ? [
          {
            name: "Skills Match",
            value: historicalData[historicalData.length - 1].skillsMatch,
            color: "hsl(var(--chart-1))",
          },
          {
            name: "Keywords",
            value: historicalData[historicalData.length - 1].keywordsMatch,
            color: "hsl(var(--chart-2))",
          },
          {
            name: "Experience",
            value: historicalData[historicalData.length - 1].experienceRelevance,
            color: "hsl(var(--chart-3))",
          },
          {
            name: "Format",
            value: historicalData[historicalData.length - 1].formatScore,
            color: "hsl(var(--chart-4))",
          },
        ]
      : []

  const radialData = [{ name: "Score", value: currentScore, fill: "hsl(var(--primary))" }]

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="h-4 w-4 text-green-600" />
    if (change < 0) return <ArrowDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold">ATS Performance Dashboard</h2>
          <p className="text-muted-foreground">Track your resume optimization progress over time</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current ATS Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(currentScore)}`}>{currentScore}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(scoreChange)}
              <span className="ml-1">
                {scoreChange > 0 ? "+" : ""}
                {scoreChange} from last analysis
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{averageScore}</div>
            <p className="text-xs text-muted-foreground">Across {historicalData.length} analyses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {historicalData.length > 0 ? Math.max(...historicalData.map((d) => d.score)) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Personal best</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analyses Count</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{historicalData.length}</div>
            <p className="text-xs text-muted-foreground">Total resume analyses</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Score Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Score Breakdown</TabsTrigger>
          <TabsTrigger value="comparison">Job Comparison</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="font-serif">ATS Score Over Time</CardTitle>
                <CardDescription>Track your resume optimization progress</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    score: {
                      label: "ATS Score",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(value) => formatDate(value)} />
                      <YAxis domain={[0, 100]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="var(--color-score)"
                        strokeWidth={2}
                        dot={{ fill: "var(--color-score)" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Current Score</CardTitle>
                <CardDescription>Radial progress indicator</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    score: {
                      label: "Score",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-[250px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={radialData}>
                      <RadialBar dataKey="value" cornerRadius={10} fill="var(--color-score)" />
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground">
                        <tspan x="50%" dy="-0.5em" className="text-2xl font-bold">
                          {currentScore}
                        </tspan>
                        <tspan x="50%" dy="1.2em" className="text-sm text-muted-foreground">
                          ATS Score
                        </tspan>
                      </text>
                    </RadialBarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Score Components</CardTitle>
                <CardDescription>Breakdown of your latest ATS analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    skillsMatch: { label: "Skills Match", color: "hsl(var(--chart-1))" },
                    keywordsMatch: { label: "Keywords", color: "hsl(var(--chart-2))" },
                    experienceRelevance: { label: "Experience", color: "hsl(var(--chart-3))" },
                    formatScore: { label: "Format", color: "hsl(var(--chart-4))" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={historicalData.slice(-1)} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" width={80} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="skillsMatch" fill="var(--color-skillsMatch)" name="Skills Match" />
                      <Bar dataKey="keywordsMatch" fill="var(--color-keywordsMatch)" name="Keywords" />
                      <Bar dataKey="experienceRelevance" fill="var(--color-experienceRelevance)" name="Experience" />
                      <Bar dataKey="formatScore" fill="var(--color-formatScore)" name="Format" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Score Distribution</CardTitle>
                <CardDescription>How your scores are distributed</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    skills: { label: "Skills Match", color: "hsl(var(--chart-1))" },
                    keywords: { label: "Keywords", color: "hsl(var(--chart-2))" },
                    experience: { label: "Experience", color: "hsl(var(--chart-3))" },
                    format: { label: "Format", color: "hsl(var(--chart-4))" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={skillsBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {skillsBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Job Application Comparison</CardTitle>
              <CardDescription>Compare your ATS scores across different job applications</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  score: {
                    label: "ATS Score",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="jobTitle" angle={-45} textAnchor="end" height={100} interval={0} />
                    <YAxis domain={[0, 100]} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value, name, props) => [`${value}%`, "ATS Score", `${props.payload.company}`]}
                    />
                    <Bar dataKey="score" fill="var(--color-score)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Performance Insights</CardTitle>
                <CardDescription>AI-powered analysis of your progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200">Improving Trend</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your ATS scores have improved by {scoreChange > 0 ? scoreChange : "several"} points over recent
                    analyses. Keep optimizing!
                  </p>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800 dark:text-blue-200">Best Performing Area</span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Your resume format consistently scores high (85%+). Focus on improving skills matching for better
                    results.
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800 dark:text-yellow-200">Recommendation</span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Analyze your resume against 2-3 more job descriptions this month to identify skill gaps.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Score Goals</CardTitle>
                <CardDescription>Track your progress towards target scores</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Target: 85+ ATS Score</span>
                    <Badge variant={currentScore >= 85 ? "default" : "secondary"}>
                      {currentScore >= 85 ? "Achieved" : `${85 - currentScore} to go`}
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((currentScore / 85) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Skills Match: 80%+</span>
                    <Badge variant={skillsBreakdownData[0]?.value >= 80 ? "default" : "secondary"}>
                      {skillsBreakdownData[0]?.value >= 80
                        ? "Achieved"
                        : `${80 - (skillsBreakdownData[0]?.value || 0)} to go`}
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-chart-1 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(((skillsBreakdownData[0]?.value || 0) / 80) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Keyword Match: 75%+</span>
                    <Badge variant={skillsBreakdownData[1]?.value >= 75 ? "default" : "secondary"}>
                      {skillsBreakdownData[1]?.value >= 75
                        ? "Achieved"
                        : `${75 - (skillsBreakdownData[1]?.value || 0)} to go`}
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-chart-2 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(((skillsBreakdownData[1]?.value || 0) / 75) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
