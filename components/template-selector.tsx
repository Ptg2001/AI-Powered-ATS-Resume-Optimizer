"use client"

import { useATSStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const TEMPLATES = [
  { id: "classic", name: "Classic", description: "Clean, traditional layout optimized for ATS" },
  { id: "modern", name: "Modern", description: "Bold headings and clear sections" },
  { id: "compact", name: "Compact", description: "Dense layout to fit more content on a page" },
]

export function TemplateSelector({ onContinue }: { onContinue?: () => void }) {
  const { selectedTemplate, setSelectedTemplate } = useATSStore()

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {TEMPLATES.map((tpl) => (
        <Card key={tpl.id} className={`hover:shadow-md transition ${selectedTemplate === tpl.id ? "ring-2 ring-primary" : ""}`}>
          <CardHeader>
            <CardTitle className="font-serif">{tpl.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{tpl.description}</p>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setSelectedTemplate(tpl.id)} variant={selectedTemplate === tpl.id ? "default" : "outline"}>
                {selectedTemplate === tpl.id ? "Selected" : "Select"}
              </Button>
              {onContinue && (
                <Button size="sm" onClick={onContinue} disabled={selectedTemplate !== tpl.id}>
                  Continue
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 