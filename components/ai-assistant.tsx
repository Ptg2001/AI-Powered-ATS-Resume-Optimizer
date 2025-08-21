"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface AIAssistantProps {
  jobDescription: string
  onApply: (target: string, newText: string) => void
  initialTarget?: string
}

export function AIAssistant({ jobDescription, onApply, initialTarget = "summary" }: AIAssistantProps) {
  const [target, setTarget] = useState(initialTarget);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const aiRewrite = async (text: string, jd: string): Promise<string> => {
    // Try Puter AI first if available
    try {
      // @ts-expect-error global
      const puter = typeof window !== "undefined" ? window.puter : undefined
      if (puter?.ai?.chat) {
        const prompt = `Rewrite the following ${target} section to be ATS-friendly, concise, and aligned with the job description. Keep original meaning, add metrics where appropriate, and include missing keywords naturally. Return plain text only.\n\nSECTION:\n${text}\n\nJOB DESCRIPTION:\n${jd}`
        const resp = await puter.ai.chat(prompt)
        if (typeof resp === "string") return resp
        if (resp?.text) return resp.text
      }
    } catch (_) {}

    // Heuristic fallback: add keywords and tighten prose
    const jdTokens = jd
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3)
    const top = Array.from(new Set(jdTokens)).slice(0, 12)
    const needsMetric = !/(\d+%|\b\d+\b)/.test(text)
    const appended = needsMetric ? (text.trim() + (text.trim().endsWith(".") ? "" : ".") + " (e.g., +20%)") : text
    const withKeywords = appended + "\n\nKeywords: " + top.slice(0, 6).join(", ")
    return withKeywords
  }

  const analyze = (text: string, jd: string): string => {
    const suggestions: string[] = []
    if (text.split(/\s+/).length < 25) suggestions.push("Expand with 1–2 quantified details relevant to the JD.")
    if (!/(\d+%|\b\d+\b)/.test(text)) suggestions.push("Add a metric (%, $, or count) to quantify results.")
    if (/(was|were|is|are|be|been|being)\s+\w+ed\b|\bby\b/i.test(text)) suggestions.push("Prefer active voice (e.g., Led, Built, Delivered).")
    const jdTokens = new Set(
      jd
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3),
    )
    const missing = Array.from(jdTokens)
      .filter((w) => !text.toLowerCase().includes(w))
      .slice(0, 6)
    if (missing.length) suggestions.push(`Consider adding keywords: ${missing.join(", ")}`)
    return suggestions.length ? suggestions.map((s) => `- ${s}`).join("\n") : "Looks good."
  }

  const handleAnalyze = () => {
    setOutput(analyze(input, jobDescription))
  }

  const handleRewrite = async () => {
    setLoading(true)
    try {
      const rewritten = await aiRewrite(input, jobDescription)
      setOutput(rewritten)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (!output.trim()) return
    onApply(target, output)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">AI Assistant</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Summary</SelectItem>
              <SelectItem value="experience">Experience</SelectItem>
              <SelectItem value="projects">Projects</SelectItem>
              <SelectItem value="skills">Skills</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="secondary">Real-time</Badge>
        </div>
        <Textarea
          className="min-h-24"
          placeholder={`Paste or type your ${target} here...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAnalyze}>Analyze</Button>
          <Button onClick={handleRewrite} disabled={loading}>{loading ? "Rewriting..." : "Rewrite with AI"}</Button>
          <Button variant="secondary" onClick={handleApply} disabled={!output.trim()}>Apply</Button>
        </div>
        <Textarea className="min-h-28" placeholder="AI output" value={output} onChange={(e) => setOutput(e.target.value)} />
      </CardContent>
    </Card>
  )
}
