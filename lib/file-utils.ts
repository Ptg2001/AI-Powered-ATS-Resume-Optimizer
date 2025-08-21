// File processing utilities for resume text extraction

export const SUPPORTED_FILE_TYPES = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/msword": ".doc",
  "text/plain": ".txt",
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!Object.keys(SUPPORTED_FILE_TYPES).includes(file.type)) {
    return {
      valid: false,
      error: "Unsupported file type. Please upload PDF, DOCX, DOC, or TXT files.",
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "File size too large. Please upload files smaller than 10MB.",
    }
  }

  return { valid: true }
}

export async function extractTextFromFile(file: File): Promise<string> {
  try {
    if (file.type === "text/plain") {
      return await file.text()
    }

    if (file.type === "application/pdf") {
      // For now, return a placeholder - in production would use pdf-parse
      return `[PDF Content Extracted from ${file.name}]\n\nThis is a placeholder for PDF text extraction. In production, this would use pdf-parse library to extract actual text content from the PDF file.`
    }

    if (file.type.includes("word") || file.type.includes("document")) {
      // For now, return a placeholder - in production would use mammoth.js
      return `[DOCX Content Extracted from ${file.name}]\n\nThis is a placeholder for DOCX text extraction. In production, this would use mammoth.js library to extract actual text content from the Word document.`
    }

    return await file.text()
  } catch (error) {
    console.error("Text extraction failed:", error)
    throw new Error("Failed to extract text from file")
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function generateFileId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
