import { GoogleGenAI } from '@google/genai';
import { config } from './config';
import { prepareInstructions, AIResponseFormat } from '../../constants';
import type { ResumeAnalysisRequest, ResumeAnalysisResponse } from './ai';

const ai = new GoogleGenAI({
  apiKey: config.gemini.apiKey,
});

function normalizeJD(text: string): string {
  return (text || '')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/[\u2022\u25E6\u2043]/g, '*')
    .replace(/[\t\r]+/g, ' ')
    .replace(/\u00A0/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 8000); // guard extremely long JDs
}

function sanitizeModelJson(jsonCandidate: string): string {
  let s = jsonCandidate
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    // remove disallowed control chars (keep basic space)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    // collapse line breaks and tabs which may appear inside string literals unescaped
    .replace(/[\r\n\t]+/g, ' ')
    // normalize quotes and dashes inside strings
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    // remove trailing commas before closing braces/brackets
    .replace(/,\s*(?=[}\]])/g, '');
  return s;
}

export async function analyzeResumeWithGemini(request: ResumeAnalysisRequest): Promise<ResumeAnalysisResponse> {
  if (!config.gemini.apiKey) {
    throw new Error('Gemini API key not configured');
  }

  // Validate input
  if (!request.resumeText || request.resumeText.trim().length === 0) {
    throw new Error('Resume text is empty or invalid');
  }

  if (!request.jobTitle || !request.jobDescription) {
    throw new Error('Job title and description are required');
  }

  const normalizedJD = normalizeJD(request.jobDescription);

  console.log(`Analyzing resume with ${request.resumeText.length} characters of text`);
  console.log(`Job Title: ${request.jobTitle}`);
  console.log(`Job Description (normalized, first 120): ${normalizedJD.substring(0, 120)}...`);
  
  // Additional validation
  if (request.resumeText.length < 100) {
    console.warn('Warning: Resume text is very short, this may indicate extraction issues');
  }
  
  // Check for common extraction issues
  if (request.resumeText.includes('') || request.resumeText.includes('')) {
    console.warn('Warning: Resume text contains replacement characters, which may indicate encoding issues');
  }
  
  // Validate text content quality
  const words = request.resumeText.split(/\s+/);
  const validWords = words.filter(word => word.length > 0 && /[a-zA-Z]/.test(word));
  console.log(`Resume contains ${validWords.length} valid words out of ${words.length} total words`);
  
  if (validWords.length < 10) {
    throw new Error('Resume text contains insufficient meaningful content for analysis');
  }

  const instructions = prepareInstructions({
    jobTitle: request.jobTitle,
    jobDescription: normalizedJD,
    AIResponseFormat,
  });

  const prompt = `
${instructions}

RESUME TEXT TO ANALYZE:
${request.resumeText}

IMPORTANT: Analyze the above resume text thoroughly and provide detailed feedback in the specified JSON format. 
Focus on the actual content, skills, and experiences mentioned in the resume.
Compare it against the job requirements and provide realistic scores.

Return ONLY the JSON object without any additional text or formatting.
`;

  try {
    // Try different Gemini models in order of preference
    const models = ["gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-1.5-pro"];
    let lastError: any = null;
    
    for (const modelName of models) {
      try {
        console.log(`Trying Gemini model: ${modelName}`);
        
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
        });

        const responseText = response.text;

        if (!responseText) {
          throw new Error('No response from Gemini AI service');
        }

        console.log(`Raw Gemini response (${modelName}):`, responseText.substring(0, 500) + '...');

        // Try to parse the JSON response
        try {
          // Clean up the response text to extract JSON
          let jsonText = responseText;
          
          // Look for JSON content
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonText = jsonMatch[0];
          }
          
          // Sanitize
          jsonText = sanitizeModelJson(jsonText);
          
          console.log(`Cleaned JSON text:`, jsonText.substring(0, 300) + '...');
          
          const analysis = JSON.parse(jsonText) as ResumeAnalysisResponse;
          
          // Validate the response structure
          if (!analysis.overallScore || !analysis.overallAssessment) {
            throw new Error('Invalid response structure - missing required fields');
          }
          
          console.log(`Successfully analyzed resume with Gemini model: ${modelName}`);
          console.log(`Overall Score: ${analysis.overallScore}`);
          console.log(`Overall Assessment: ${analysis.overallAssessment}`);
          
          return analysis;
        } catch (parseError) {
          console.error(`Failed to parse Gemini response from ${modelName}:`, parseError);
          console.error(`Response text:`, responseText);
          throw new Error(`Invalid response format from Gemini AI service: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
        }
      } catch (modelError) {
        console.warn(`Gemini model ${modelName} failed:`, modelError);
        lastError = modelError;
        continue; // Try next model
      }
    }
    
    // If all models failed, throw the last error
    throw lastError || new Error('All Gemini models failed');
  } catch (error) {
    console.error('Gemini AI analysis error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Gemini API key is invalid or expired');
      } else if (error.message.includes('quota')) {
        throw new Error('Gemini API quota exceeded. Please try again later.');
      } else if (error.message.includes('rate limit')) {
        throw new Error('Too many requests to Gemini API. Please wait a moment and try again.');
      } else if (error.message.includes('Invalid response format')) {
        throw new Error('AI analysis failed due to response format issues. Please try again.');
      }
    }
    
    throw new Error(`Failed to analyze resume with Gemini AI: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
