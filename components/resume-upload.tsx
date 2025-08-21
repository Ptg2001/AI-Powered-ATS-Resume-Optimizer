"use client"

import { useCallback, useRef, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react"
import { useATSStore } from "@/lib/store"
import {
  validateFile,
  extractTextFromFile,
  formatFileSize,
  generateFileId,
  SUPPORTED_FILE_TYPES,
} from "@/lib/file-utils"
import type { ResumeFile } from "@/lib/store"
import { saveResumeToCloud } from "@/lib/puter"
import { formatDate, toIsoString } from "@/lib/utils"

export function ResumeUpload() {
  const { addResume, currentResume, isUploading, setIsUploading, uploadProgress, setUploadProgress } = useATSStore()

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const processFile = async (file: File) => {
    setError(null)
    setSuccess(null)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const validation = validateFile(file)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      setUploadProgress(25)

      const extractedText = await extractTextFromFile(file)
      setUploadProgress(75)

      const resume: ResumeFile = {
        id: generateFileId(),
        name: file.name,
        size: file.size,
        type: file.type,
        content: await file.text().catch(() => ""),
        extractedText,
        uploadedAt: new Date(),
      }

      setUploadProgress(100)

      addResume(resume)

      saveResumeToCloud({
        ...resume,
        uploadedAt: toIsoString(resume.uploadedAt),
      }).catch(() => {})

      setSuccess(`Successfully uploaded ${file.name}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed"
      setError(errorMessage)
      console.error("Upload error:", err)
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: SUPPORTED_FILE_TYPES as any,
    maxFiles: 1,
    disabled: isUploading,
    noClick: true,
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Your Resume
          </CardTitle>
          <CardDescription>Upload your current resume to get started with ATS optimization</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
              ${isUploading ? "pointer-events-none opacity-50" : ""}
            `}
          >
            <input {...getInputProps()} />

            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Upload className="h-8 w-8 text-primary" />
              </div>

              {isDragActive ? (
                <div>
                  <p className="text-lg font-medium">Drop your resume here</p>
                  <p className="text-sm text-muted-foreground">Release to upload</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium">Drag & drop your resume here</p>
                  <p className="text-sm text-muted-foreground">or click to browse files</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 justify-center">
                {Object.values(SUPPORTED_FILE_TYPES).map((ext) => (
                  <Badge key={ext} variant="secondary" className="text-xs">
                    {ext.toUpperCase()}
                  </Badge>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">Maximum file size: 10MB</p>
              <Button variant="outline" size="sm" onClick={open} disabled={isUploading} className="mt-2">
                Browse Files
              </Button>
            </div>
          </div>

          {isUploading && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading and processing...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

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

      {currentResume && <ResumePreview resume={currentResume} onReupload={open} />}
    </div>
  )
}

function ResumePreview({ resume, onReupload }: { resume: ResumeFile; onReupload: () => void }) {
  const { setCurrentResume, removeResume } = useATSStore()

  const handleRemove = () => {
    removeResume(resume.id)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Current Resume
          </div>
          <Button variant="ghost" size="sm" onClick={handleRemove}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">{resume.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(resume.size)} • Uploaded {formatDate(resume.uploadedAt)}
                </p>
              </div>
            </div>
            <Badge variant="secondary">{resume.type.split("/").pop()?.toUpperCase()}</Badge>
          </div>

          {resume.extractedText && (
            <div>
              <h4 className="font-medium mb-2">Extracted Content Preview</h4>
              <div className="p-4 bg-muted/30 rounded-lg max-h-40 overflow-y-auto">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {resume.extractedText.substring(0, 500)}
                  {resume.extractedText.length > 500 && "..."}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">View Full Content</Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{resume.name}</DialogTitle>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-auto whitespace-pre-wrap text-sm">
                  {resume.extractedText || resume.content || "No content available."}
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={onReupload}>
              Re-upload
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
