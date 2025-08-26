// Universal document text extraction for PDF and DOCX files
export async function extractTextFromDocument(file: File): Promise<string> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('Document processing must be done on the client side');
  }

  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Document processing timed out')), 30000); // 30 second timeout
    });

    const processingPromise = (async () => {
      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        return await extractTextFromPDF(file);
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
        return await extractTextFromDOCX(file);
      } else {
        throw new Error('Unsupported file format. Please upload a PDF or DOCX file.');
      }
    })();

    return await Promise.race([processingPromise, timeoutPromise]);
  } catch (error) {
    console.error('Document processing error:', error);
    throw error;
  }
}

// Normalize LaTeX/Unicode quirks for better ATS parsing
function normalizeExtractedText(text: string): string {
  // Replace common ligatures and symbols
  const ligatureMap: Record<string, string> = {
    '\uFB00': 'ff', // ﬀ
    '\uFB01': 'fi', // ﬁ
    '\uFB02': 'fl', // ﬂ
    '\uFB03': 'ffi', // ﬃ
    '\uFB04': 'ffl', // ﬄ
    '\uFB05': 'st', // ﬅ (rare)
    '\uFB06': 'st', // ﬆ (rare)
  };
  let normalized = text.replace(/[\uFB00-\uFB06]/g, m => ligatureMap[m] || m);

  // Remove soft hyphens and join hyphenated line breaks (LaTeX)
  normalized = normalized
    .replace(/\u00AD/g, '') // soft hyphen
    .replace(/-\s*\n(?=[a-z])/g, '') // join hyphenated words across line breaks
    .replace(/\s*\n\s*/g, '\n'); // tidy line breaks

  // Normalize quotes/dashes and bullets
  normalized = normalized
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'") // single quotes
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"') // double quotes
    .replace(/[\u2013\u2014\u2212]/g, '-') // en/em dashes to hyphen
    .replace(/[\u2022\u25E6\u2043]/g, '•'); // bullets to a common character

  // NFKD normalize + strip combining marks (remove diacritics)
  normalized = normalized
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');

  // Collapse excessive spaces
  normalized = normalized
    .replace(/\t|\r/g, ' ')
    .replace(/\u00A0/g, ' ') // non-breaking space
    .replace(/\s{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return normalized;
}

// Helper: reconstruct page text preserving reading order using item positions
function reconstructPageTextFromItems(textContent: any): string {
  // Group items by their baseline Y position (with tolerance), then sort by X
  type Positioned = { str: string; x: number; y: number };
  const items: Positioned[] = (textContent.items || []).map((it: any) => {
    // transform matrix: [a, b, c, d, e(x), f(y)]
    const x = Array.isArray(it.transform) ? (it.transform[4] as number) : (it.x || 0);
    const y = Array.isArray(it.transform) ? (it.transform[5] as number) : (it.y || 0);
    return { str: it.str as string, x, y };
  });

  if (items.length === 0) return '';

  // Normalize Y to buckets (handle small jitter). Higher Y is lower on page in PDF coordinates.
  const tolerance = 2; // px
  const linesMap = new Map<number, Positioned[]>();

  for (const it of items) {
    let bucket = Math.round(it.y);
    // Find existing bucket within tolerance
    for (const key of linesMap.keys()) {
      if (Math.abs(key - bucket) <= tolerance) {
        bucket = key;
        break;
      }
    }
    const arr = linesMap.get(bucket) || [];
    arr.push(it);
    linesMap.set(bucket, arr);
  }

  // Convert to line objects with x-range and midX
  const rawLines = Array.from(linesMap.entries()).map(([y, arr]) => {
    const ordered = arr.sort((i1, i2) => i1.x - i2.x);
    const text = ordered.map(i => (i.str || '').trim()).filter(Boolean).join(' ').trim();
    const xs = ordered.map(i => i.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const midX = (minX + maxX) / 2;
    return { y, text, minX, maxX, midX };
  }).filter(l => l.text.length > 0);

  if (rawLines.length === 0) return '';

  // Detect simple two-column layout by spread of midX
  const mids = rawLines.map(l => l.midX).sort((a,b)=>a-b);
  const p10 = mids[Math.floor(0.1 * (mids.length-1))];
  const p90 = mids[Math.floor(0.9 * (mids.length-1))];
  const spread = p90 - p10;

  if (spread > 200) { // likely two columns
    const globalMedian = mids[Math.floor(mids.length/2)];
    const leftCol = rawLines.filter(l => l.midX <= globalMedian).sort((a,b)=>b.y - a.y);
    const rightCol = rawLines.filter(l => l.midX > globalMedian).sort((a,b)=>b.y - a.y);
    const leftText = leftCol.map(l => l.text).join('\n');
    const rightText = rightCol.map(l => l.text).join('\n');
    return [leftText, rightText].filter(Boolean).join('\n\n');
  }

  // Single column: sort lines by Y (top to bottom)
  const orderedLines = rawLines.sort((a, b) => b.y - a.y);
  return orderedLines.map(l => l.text).join('\n');
}

// OCR fallback with Tesseract.js for image-based or stubborn PDFs
async function ocrExtractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  // Dynamic import and graceful failure if not available
  let pdfjsLib: any;
  try {
    pdfjsLib = await import('pdfjs-dist');
  } catch {
    throw new Error('PDF engine not available for OCR fallback');
  }

  let Tesseract: any;
  try {
    const modName = 'tesseract.js';
    const dynImport: (m: string) => Promise<any> = (m) => import(/* @vite-ignore */ m);
    Tesseract = await dynImport(modName);
  } catch (e) {
    console.warn('Tesseract.js not installed. Skipping OCR fallback.', e);
    throw new Error('OCR engine not available');
  }

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let text = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) continue;
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context as any, viewport }).promise;

    const dataUrl = canvas.toDataURL('image/png');

    try {
      const result = await Tesseract.recognize(dataUrl, 'eng', { logger: () => {} });
      const pageText = (result?.data?.text || '').trim();
      if (pageText) text += pageText + '\n\n';
    } catch (ocrErr) {
      console.warn(`OCR failed on page ${pageNum}:`, ocrErr);
    }
  }

  return text.trim();
}

// PDF text extraction using PDF.js
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Validate file size
    if (arrayBuffer.byteLength === 0) {
      throw new Error('PDF file appears to be empty or corrupted');
    }

    // Import PDF.js dynamically (standard build)
    let pdfjsLib: any;
    try {
      pdfjsLib = await import('pdfjs-dist');
    } catch (importError) {
      console.error('Failed to import PDF.js:', importError);
      throw new Error('PDF processing library failed to load. Please refresh the page and try again.');
    }
    
    // Set worker path to the exact version bundled with pdfjs-dist (avoids version mismatch)
    try {
      const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
      if (pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
        console.log('PDF.js worker path set to bundled version');
      }
    } catch (workerError) {
      console.warn('Failed to set bundled PDF.js worker path, falling back:', workerError);
      try {
        if (pdfjsLib.GlobalWorkerOptions) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        }
      } catch {}
    }

    // Load the PDF document
    console.log('Loading PDF document...');
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    console.log(`PDF loaded successfully with ${pdf.numPages} pages`);

    let fullText = '';
    const numPages = pdf.numPages;

    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        console.log(`Processing page ${pageNum}/${numPages}...`);
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent({ normalizeWhitespace: true, includeMarkedContent: true });
        
        // Reconstruct page text using positions for accurate reading order
        const pageText = reconstructPageTextFromItems(textContent);
        
        fullText += pageText + '\n\n';
        console.log(`Page ${pageNum}: extracted ${pageText.length} characters`);
      } catch (pageError) {
        console.warn(`Failed to extract text from page ${pageNum}:`, pageError);
      }
    }

    // Clean up and normalize the extracted text (LaTeX-aware)
    const cleanedTextRaw = fullText
      .replace(/\s+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[\t\r]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    let cleanedText = normalizeExtractedText(cleanedTextRaw);

    // Guard: detect binary-like garbage (very low printable ratio)
    const printable = cleanedText.replace(/[^\x20-\x7E\n]/g, '');
    const ratio = printable.length / Math.max(1, cleanedText.length);
    let needsOCR = false;
    if (ratio < 0.7) {
      console.warn('Extracted text appears binary-like; attempting stricter normalization');
      cleanedText = normalizeExtractedText(printable);
      if ((cleanedText.replace(/[^\x20-\x7E\n]/g, '').length / Math.max(1, cleanedText.length)) < 0.7) {
        needsOCR = true;
      }
    }

    // Validate content quality
    const words = cleanedText.split(/\s+/);
    const hasValidContent = words.some(word => word.length > 2 && /[a-zA-Z]/.test(word) && !/^[0-9\s\-_]+$/.test(word));

    if (!hasValidContent || words.length < 10 || needsOCR) {
      console.warn('Switching to OCR fallback due to poor text quality...');
      try {
        const ocrText = await ocrExtractTextFromPDF(arrayBuffer);
        const normalizedOCR = normalizeExtractedText(ocrText);
        if (normalizedOCR && normalizedOCR.split(/\s+/).length >= 10) {
          console.log('OCR fallback succeeded');
          return normalizedOCR;
        }
        console.warn('OCR fallback produced insufficient text');
      } catch (ocrError) {
        console.warn('OCR fallback unavailable or failed:', ocrError);
      }

      if (!hasValidContent || words.length < 10) {
        throw new Error('No readable text could be extracted from the PDF. It may be image-based or corrupted.');
      }
    }

    console.log(`Successfully extracted ${words.length} words from PDF`);
    console.log('Sample extracted text:', cleanedText.substring(0, 300) + '...');
    return cleanedText;
  } catch (error) {
    console.error('PDF processing error:', error);
    
    // Final fallback only: try OCR straight away
    try {
      const arrayBuffer = await file.arrayBuffer();
      const ocrText = await ocrExtractTextFromPDF(arrayBuffer);
      const normalizedOCR = normalizeExtractedText(ocrText);
      if (normalizedOCR && normalizedOCR.split(/\s+/).length >= 10) {
        console.log('OCR-only fallback succeeded');
        return normalizedOCR;
      }
    } catch {}

    throw new Error(`PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Fallback PDF text extraction - simpler approach
async function extractTextFromPDFFallback(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const bytes = new Uint8Array(arrayBuffer);
    
    // Simple approach: look for ASCII text content
    let text = '';
    let consecutiveText = 0;
    
    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
      
      // Check if byte represents a printable ASCII character
      if (byte >= 32 && byte <= 126) {
        consecutiveText++;
        text += String.fromCharCode(byte);
      } else {
        if (consecutiveText > 10) { // Only keep sequences longer than 10 characters
          text += ' ';
        }
        consecutiveText = 0;
      }
    }
    
    // Clean up the extracted text
    const cleanedText = text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s]/g, ' ') // Remove special characters
      .trim();
    
    if (cleanedText.length < 50) {
      throw new Error('Insufficient text content extracted');
    }
    
    return cleanedText;
  } catch (error) {
    console.warn('Fallback PDF extraction failed:', error);
    throw new Error('Unable to extract text from PDF using any method');
  }
}

// DOCX text extraction
async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Validate file size
    if (arrayBuffer.byteLength === 0) {
      throw new Error('DOCX file appears to be empty or corrupted');
    }

    // DOCX files are ZIP archives containing XML files
    // We'll extract the main document content
    const text = await extractTextFromDOCXBasic(arrayBuffer);
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text could be extracted from the DOCX file.');
    }
    
    return text.trim();
  } catch (error) {
    console.error('DOCX processing error:', error);
    throw new Error(`DOCX processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Basic DOCX text extraction
async function extractTextFromDOCXBasic(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // For now, we'll use a simple approach to extract text
    // In a production environment, you might want to use a library like mammoth.js
    
    // Convert to string and look for text content
    const content = String.fromCharCode(...new Uint8Array(arrayBuffer));
    
    // Look for text content in the DOCX structure
    // This is a simplified approach - in reality, DOCX parsing is more complex
    const textMatches = content.match(/[a-zA-Z\s]{3,}/g);
    
    if (textMatches && textMatches.length > 0) {
      return textMatches
        .filter(text => text.trim().length > 3)
        .join(' ');
    }

    throw new Error('No readable text content found in DOCX file');
  } catch (error) {
    console.warn('Basic DOCX extraction failed:', error);
    throw error;
  }
}

export function validateDocumentFile(file: File): { isValid: boolean; error?: string } {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
  // Check file type
  if (fileType !== 'application/pdf' && 
      fileType !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
      !fileName.endsWith('.pdf') && 
      !fileName.endsWith('.docx')) {
    return { isValid: false, error: 'Only PDF and DOCX files are allowed' };
  }
  
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 10MB' };
  }

  // Check if file has content
  if (file.size === 0) {
    return { isValid: false, error: 'File appears to be empty' };
  }

  // Check file name
  if (!fileName.endsWith('.pdf') && !fileName.endsWith('.docx')) {
    return { isValid: false, error: 'File must have a .pdf or .docx extension' };
  }
  
  return { isValid: true };
}

// Keep the old function name for backward compatibility
export function validatePDFFile(file: File): { isValid: boolean; error?: string } {
  return validateDocumentFile(file);
}
