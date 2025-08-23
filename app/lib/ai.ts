import { config } from './config';
import { prepareInstructions, AIResponseFormat } from '../../constants';

export interface ResumeAnalysisRequest {
  resumeText: string;
  jobTitle: string;
  jobDescription: string;
}

export interface ResumeAnalysisResponse {
  overallScore: number;
  ATS: {
    score: number;
    tips: {
      type: "good" | "improve";
      tip: string;
    }[];
  };
  toneAndStyle: {
    score: number;
    tips: {
      type: "good" | "improve";
      tip: string;
      explanation: string;
    }[];
  };
  content: {
    score: number;
    tips: {
      type: "good" | "improve";
      tip: string;
      explanation: string;
    }[];
  };
  structure: {
    score: number;
    tips: {
      type: "good" | "improve";
      tip: string;
      explanation: string;
    }[];
  };
  skills: {
    score: number;
    tips: {
      type: "good" | "improve";
      tip: string;
      explanation: string;
    }[];
  };
}

export async function analyzeResume(request: ResumeAnalysisRequest): Promise<ResumeAnalysisResponse> {
  if (!config.gemini.apiKey) {
    throw new Error('Gemini API key not configured. Please check your environment variables.');
  }

  try {
    const { analyzeResumeWithGemini } = await import('./gemini-ai');
    return await analyzeResumeWithGemini(request);
  } catch (error) {
    console.error('Gemini AI analysis failed:', error);
    throw new Error('Failed to analyze resume with Gemini AI. Please try again.');
  }
}
