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

// PDF text extraction without external worker dependencies
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Validate file size
    if (arrayBuffer.byteLength === 0) {
      throw new Error('PDF file appears to be empty or corrupted');
    }

    // Try to extract text using basic PDF parsing
    let text: string;
    try {
      text = await extractTextFromPDFBasic(arrayBuffer);
    } catch (extractionError) {
      console.warn('Primary PDF extraction failed, trying fallback method:', extractionError);
      // Fallback: try to extract any readable text
      text = await extractTextFromPDFFallback(arrayBuffer);
    }
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text could be extracted from the PDF. The file might be image-based or password-protected.');
    }
    
    return text.trim();
  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error(`PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Basic PDF text extraction without PDF.js
async function extractTextFromPDFBasic(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // Convert ArrayBuffer to Uint8Array for processing
    const bytes = new Uint8Array(arrayBuffer);
    
    // Check PDF header
    const header = String.fromCharCode(...bytes.slice(0, 8));
    if (!header.startsWith('%PDF-')) {
      throw new Error('Invalid PDF file format');
    }

    // Convert to string in chunks to avoid memory issues
    const chunkSize = 100000; // Process in 100KB chunks
    let fullText = '';
    
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      const chunkText = String.fromCharCode(...chunk);
      fullText += chunkText;
    }

    // Simple text extraction without complex regex
    let extractedText = '';
    
    // Look for text between parentheses (common in PDFs)
    let inParentheses = false;
    let currentText = '';
    
    for (let i = 0; i < fullText.length; i++) {
      const char = fullText[i];
      
      if (char === '(') {
        inParentheses = true;
        currentText = '';
      } else if (char === ')' && inParentheses) {
        inParentheses = false;
        if (currentText.length > 3 && /[a-zA-Z]/.test(currentText)) {
          extractedText += currentText + ' ';
        }
        currentText = '';
      } else if (inParentheses) {
        currentText += char;
      }
    }

    // If no text found in parentheses, try to extract any readable text
    if (!extractedText || extractedText.trim().length === 0) {
      const words = fullText.split(/\s+/);
      const readableWords = words.filter(word => 
        word.length > 2 && 
        /[a-zA-Z]/.test(word) && 
        !/^[0-9\s]+$/.test(word)
      );
      
      if (readableWords.length > 0) {
        extractedText = readableWords.slice(0, 1000).join(' '); // Limit to first 1000 words
      }
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No readable text content found in PDF');
    }

    return extractedText.trim();
  } catch (error) {
    console.warn('Basic PDF extraction failed:', error);
    throw error;
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
