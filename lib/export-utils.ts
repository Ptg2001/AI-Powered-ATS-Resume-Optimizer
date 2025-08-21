"use client"

// Utilities to export text content as DOCX, PDF, or TXT

export async function exportTextAsDocx(filename: string, title: string, content: string) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx")
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
          ...content.split("\n\n").map((para) => new Paragraph({ children: [new TextRun(para)] })),
        ],
      },
    ],
  })
  const blob = await Packer.toBlob(doc)
  triggerDownload(blob, ensureExt(filename, ".docx"))
}

export async function exportTextAsPdf(filename: string, title: string, content: string) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib")
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792]) // Letter size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontTitle = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let x = 50
  let y = 742
  const lineHeight = 16
  const maxWidth = 512

  const drawText = (text: string, isTitle = false) => {
    const fontToUse = isTitle ? fontTitle : font
    const size = isTitle ? 18 : 12
    const words = text.split(/\s+/)
    let line = ""
    const lines: string[] = []
    for (const w of words) {
      const testLine = line ? line + " " + w : w
      const width = fontToUse.widthOfTextAtSize(testLine, size)
      if (width > maxWidth) {
        if (line) lines.push(line)
        line = w
      } else {
        line = testLine
      }
    }
    if (line) lines.push(line)
    lines.forEach((ln) => {
      if (y < 50) {
        // new page
        const p = pdfDoc.addPage([612, 792])
        y = 742
      }
      page.drawText(ln, { x, y, size, font: fontToUse, color: rgb(0, 0, 0) })
      y -= lineHeight
    })
  }

  drawText(title, true)
  y -= lineHeight
  content.split("\n\n").forEach((paragraph) => {
    drawText(paragraph)
    y -= lineHeight / 2
  })

  const blob = new Blob([await pdfDoc.save()], { type: "application/pdf" })
  triggerDownload(blob, ensureExt(filename, ".pdf"))
}

export async function exportTextAsTxt(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  triggerDownload(blob, ensureExt(filename, ".txt"))
}

function triggerDownload(blob: Blob, filename: string) {
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  setTimeout(() => {
    URL.revokeObjectURL(link.href)
    document.body.removeChild(link)
  }, 0)
}

function ensureExt(name: string, ext: string) {
  return name.toLowerCase().endsWith(ext) ? name : `${name}${ext}`
} 