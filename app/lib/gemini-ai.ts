import { GoogleGenAI } from '@google/genai';
import { config } from './config';
import { prepareInstructions, AIResponseFormat } from '../../constants';
import type { ResumeAnalysisRequest, ResumeAnalysisResponse } from './ai';

const ai = new GoogleGenAI({
  apiKey: config.gemini.apiKey,
});

export async function analyzeResumeWithGemini(request: ResumeAnalysisRequest): Promise<ResumeAnalysisResponse> {
  if (!config.gemini.apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const instructions = prepareInstructions({
    jobTitle: request.jobTitle,
    jobDescription: request.jobDescription,
    AIResponseFormat,
  });

  const prompt = `
${instructions}

Resume Text:
${request.resumeText}

Please analyze this resume and provide feedback in the specified JSON format. Return ONLY the JSON object without any additional text or formatting.
`;

  try {
    // Try different Gemini models in order of preference
    const models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
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

        // Try to parse the JSON response
        try {
          // Clean up the response text to extract JSON
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          const jsonText = jsonMatch ? jsonMatch[0] : responseText;
          
          const analysis = JSON.parse(jsonText) as ResumeAnalysisResponse;
          console.log(`Successfully analyzed resume with Gemini model: ${modelName}`);
          return analysis;
        } catch (parseError) {
          console.error(`Failed to parse Gemini response from ${modelName}:`, responseText);
          throw new Error('Invalid response format from Gemini AI service');
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
    throw new Error('Failed to analyze resume with Gemini AI');
  }
}
