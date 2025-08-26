import { config } from './config';
import { prepareInstructions, AIResponseFormat } from '../../constants';

export interface ResumeAnalysisRequest {
  resumeText: string;
  jobTitle: string;
  jobDescription: string;
}

export interface ResumeAnalysisResponse {
  overallScore: number;
  overallAssessment: string; // Brief summary of why this score was given
  ATS: {
    score: number;
    keywordMatch?: number;
    missingKeywords?: string[];
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

// --- Shared normalization for robust matching (LaTeX/Unicode tolerant) ---
function normalizeForMatch(text: string): string {
  return text
    .replace(/[\uFB00-\uFB06]/g, m => ({'\uFB00':'ff','\uFB01':'fi','\uFB02':'fl','\uFB03':'ffi','\uFB04':'ffl','\uFB05':'st','\uFB06':'st'} as any)[m] || m)
    .replace(/\u00AD/g, '')
    .replace(/-\s*\n(?=[a-z])/g, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function tokenize(text: string): string[] {
  const t = normalizeForMatch(text)
    .replace(/[^a-z0-9+.#/\-\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  return t;
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

const STOPWORDS = new Set([
  'the','and','a','an','to','of','in','on','for','with','by','as','is','are','was','were','be','being','been','at','from','or','that','this','it','into','over','per','via','using','use','used','using'
]);

const TECH_KEYWORDS = [
  'python','java','javascript','typescript','react','node','spring','springboot','mysql','mongodb','docker','aws','gcp','azure','kubernetes','flask','django','tensorflow','pytorch','nlp','ml','ai','devops','rest','graphql','sql','nosql','redis','postgres','html','css','tailwind','nextjs','reactjs','nodejs'
];

function extractKeywords(jobDescription: string): string[] {
  const tokens = tokenize(jobDescription)
    .filter(t => !STOPWORDS.has(t))
    .filter(t => t.length >= 3);
  const jdTop = unique(tokens);
  const prioritized = [
    ...TECH_KEYWORDS.filter(k => jdTop.includes(k)),
    ...jdTop.filter(k => !TECH_KEYWORDS.includes(k)).slice(0, 60),
  ];
  return unique(prioritized).slice(0, 80);
}

function buildKeywordRegexes(raw: string): RegExp[] {
  const k = normalizeForMatch(raw);
  // Special handling
  if (k === 'c++' || k === 'cplusplus' || k === 'c-plus-plus' || k === 'cxx') {
    return [
      /\bc\s*\+\s*\+\b/i,
      /\bc\s*plus\s*plus\b/i,
      /\bc\s*\+\s*\+\s*\b/i,
      /\bcxx\b/i,
      /\bc\s*\+\+\b/i,
    ];
  }
  if (k === 'java') {
    // Match java but not javascript
    return [/\bjava(?!script)\b/i];
  }
  if (k === 'js') {
    return [/\bjs\b/i, /\bjavascript\b/i];
  }
  // Default: strict word boundary
  return [new RegExp(`\\b${k.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, 'i')];
}

function keywordPresent(resumeText: string, keyword: string, resumeTokens: Set<string>): boolean {
  const kNorm = normalizeForMatch(keyword);
  // Fast token check
  if (resumeTokens.has(kNorm)) return true;
  const variants = unique([
    kNorm,
    kNorm.replace(/\s+/g, ''),
    kNorm.replace(/[-_]/g, ''),
    kNorm.replace(/js$/, 'javascript'),
    kNorm.replace(/developer$/, 'dev'),
  ]);
  if (variants.some(v => resumeTokens.has(v))) return true;

  // Regex-based robust check on the normalized resume string
  const resumeNorm = normalizeForMatch(resumeText);
  const regexes = [
    ...buildKeywordRegexes(kNorm),
    ...variants.filter(v => v !== kNorm).map(v => new RegExp(`\\b${v.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, 'i')),
  ];
  if (regexes.some(rx => rx.test(resumeNorm))) return true;

  // Additional fuzzy: compare stripped alphanumerics to catch p y t h o n style
  const resumeStripped = resumeNorm.replace(/[^a-z0-9]+/g, '');
  const kwStrippedVariants = unique([
    kNorm.replace(/[^a-z0-9]+/g, ''),
    ...variants.map(v => v.replace(/[^a-z0-9]+/g, '')),
  ]);
  if (kwStrippedVariants.some(v => v && resumeStripped.includes(v))) return true;

  return false;
}

function computeKeywordStats(resumeText: string, jobDescription: string) {
  const resumeTokens = new Set(tokenize(resumeText));
  const keywords = extractKeywords(jobDescription);
  const present: string[] = [];
  const missing: string[] = [];

  for (const k of keywords) {
    const found = keywordPresent(resumeText, k, resumeTokens);
    (found ? present : missing).push(k);
  }
  const keywordMatch = Math.round((present.length / Math.max(1, keywords.length)) * 100);
  // Debug (server logs only)
  try {
    console.log('[ATS] keywordMatch %d | present(%d): %s | missing(%d): %s',
      keywordMatch,
      present.length,
      present.slice(0, 20).join(', '),
      missing.length,
      missing.slice(0, 20).join(', ')
    );
  } catch {}
  return { keywordMatch, missingKeywords: missing.slice(0, 20) };
}

function assessFormatting(resumeText: string) {
  const words = tokenize(resumeText);
  const hasEncodingIssues = /\uFFFD|/.test(resumeText);
  const lines = normalizeForMatch(resumeText).split(/\n/);
  const avgLineLen = lines.reduce((s,l)=>s+l.length,0)/Math.max(1,lines.length);
  const tooShort = words.length < 120;
  let structure = 100;
  if (hasEncodingIssues) structure -= 20;
  if (tooShort) structure -= 25;
  if (avgLineLen > 200) structure -= 10;
  return Math.max(20, Math.min(100, structure));
}

function recomputeScores(
  base: ResumeAnalysisResponse,
  resumeText: string,
  jobDescription: string
): ResumeAnalysisResponse {
  const { keywordMatch, missingKeywords } = computeKeywordStats(resumeText, jobDescription);
  const structureHeuristic = assessFormatting(resumeText);

  const atsBase = Number.isFinite(base.ATS?.score) ? base.ATS.score : 0;
  const blendedATS = Math.round(0.6 * atsBase + 0.25 * keywordMatch + 0.15 * structureHeuristic);

  const contentScore = Number.isFinite(base.content?.score) ? base.content.score : 60;
  const toneScore = Number.isFinite(base.toneAndStyle?.score) ? base.toneAndStyle.score : 60;
  const structureScore = Number.isFinite(base.structure?.score) ? base.structure.score : structureHeuristic;

  const overall = Math.round(0.5 * blendedATS + 0.2 * contentScore + 0.15 * structureScore + 0.15 * toneScore);
  const overallClamped = Math.max(30, Math.min(98, overall));

  const overallAssessment = base.overallAssessment && base.overallAssessment.trim().length > 0
    ? base.overallAssessment
    : `Keyword match ${keywordMatch}%. ${missingKeywords.length ? `Missing: ${missingKeywords.slice(0,6).join(', ')}.` : 'Good coverage.'}`;

  return {
    ...base,
    overallScore: overallClamped,
    overallAssessment,
    ATS: {
      ...base.ATS,
      score: Math.max(20, Math.min(98, blendedATS)),
      keywordMatch,
      missingKeywords,
    },
    structure: { ...base.structure, score: structureScore },
  } as ResumeAnalysisResponse;
}

export async function analyzeResume(request: ResumeAnalysisRequest): Promise<ResumeAnalysisResponse> {
  if (!config.gemini.apiKey) {
    throw new Error('Gemini API key not configured. Please check your environment variables.');
  }

  try {
    const { analyzeResumeWithGemini } = await import('./gemini-ai');
    const aiResult = await analyzeResumeWithGemini({
      ...request,
      // Normalize text before sending to AI as well, improving its parsing
      resumeText: normalizeForMatch(request.resumeText),
      jobDescription: request.jobDescription,
      jobTitle: request.jobTitle,
    } as any);
    const finalResult = recomputeScores(aiResult, request.resumeText, request.jobDescription);
    console.log('[ATS] final overall %d | ATS %d | keywordMatch %s', finalResult.overallScore, finalResult.ATS.score, String(finalResult.ATS.keywordMatch));
    return finalResult;
  } catch (error) {
    console.error('Gemini AI analysis failed:', error);
    throw new Error('Failed to analyze resume with Gemini AI. Please try again.');
  }
}
