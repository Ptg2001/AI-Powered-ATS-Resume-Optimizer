"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, AlertCircle, User, ArrowRight } from "lucide-react"
import type { UserSkillConfirmation } from "@/lib/ai-analysis"

interface SkillConfirmationProps {
  skills: UserSkillConfirmation[]
  onConfirm: (confirmedSkills: UserSkillConfirmation[]) => void
  isLoading?: boolean
}

export function SkillConfirmation({ skills, onConfirm, isLoading = false }: SkillConfirmationProps) {
  const [confirmedSkills, setConfirmedSkills] = useState<UserSkillConfirmation[]>(skills)

  const updateSkill = (index: number, updates: Partial<UserSkillConfirmation>) => {
    const updated = [...confirmedSkills]
    updated[index] = { ...updated[index], ...updates }
    setConfirmedSkills(updated)
  }

  const handleSubmit = () => {
    onConfirm(confirmedSkills)
  }

  const confirmedCount = confirmedSkills.filter((s) => s.hasSkill).length
  const totalCount = confirmedSkills.length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Confirm Your Skills
        </CardTitle>
        <CardDescription>
          Review and confirm the skills we detected. This helps us provide more accurate analysis.
        </CardDescription>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            <span>{confirmedCount} confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span>{totalCount - confirmedCount} to review</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid gap-4">
            {confirmedSkills.map((skill, index) => (
              <div key={skill.skill} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={skill.hasSkill}
                      onCheckedChange={(checked) => updateSkill(index, { hasSkill: checked as boolean })}
                    />
                    <div>
                      <Label className="font-medium">{skill.skill}</Label>
                      {!skill.hasSkill && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Missing
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {skill.hasSkill && (
                  <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Proficiency Level</Label>
                      <Select
                        value={skill.proficiencyLevel}
                        onValueChange={(value) =>
                          updateSkill(index, {
                            proficiencyLevel: value as UserSkillConfirmation["proficiencyLevel"],
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Years of Experience</Label>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        value={skill.yearsOfExperience || 0}
                        onChange={(e) =>
                          updateSkill(index, {
                            yearsOfExperience: Number.parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {confirmedCount} of {totalCount} skills confirmed
            </div>
            <Button onClick={handleSubmit} disabled={isLoading} size="lg">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  Continue Analysis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
