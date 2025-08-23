export const resumes: Resume[] = [
    {
        id: "1",
        companyName: "Google",
        jobTitle: "Frontend Developer",
        imagePath: "/images/resume-1.png",
        resumePath: "/resumes/resume-1.pdf",
        feedback: {
            overallScore: 85,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "2",
        companyName: "Microsoft",
        jobTitle: "Cloud Engineer",
        imagePath: "/images/resume-2.png",
        resumePath: "/resumes/resume-2.pdf",
        feedback: {
            overallScore: 55,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "3",
        companyName: "Apple",
        jobTitle: "iOS Developer",
        imagePath: "/images/resume-3.png",
        resumePath: "/resumes/resume-3.pdf",
        feedback: {
            overallScore: 75,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "4",
        companyName: "Google",
        jobTitle: "Frontend Developer",
        imagePath: "/images/resume-1.png",
        resumePath: "/resumes/resume-1.pdf",
        feedback: {
            overallScore: 85,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "5",
        companyName: "Microsoft",
        jobTitle: "Cloud Engineer",
        imagePath: "/images/resume-2.png",
        resumePath: "/resumes/resume-2.pdf",
        feedback: {
            overallScore: 55,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "6",
        companyName: "Apple",
        jobTitle: "iOS Developer",
        imagePath: "/images/resume-3.png",
        resumePath: "/resumes/resume-3.pdf",
        feedback: {
            overallScore: 75,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
];

export const AIResponseFormat = `
      interface Feedback {
      overallScore: number; //CRITICAL: This is the main score that determines if the resume passes ATS screening. Score realistically between 35-95. Most real resumes score 45-75.
      overallAssessment: string; //Brief summary of why this score was given (e.g., "Good keyword matching but poor formatting")
      ATS: {
        score: number; //rate based on ATS suitability (0-100)
        keywordMatch: number; //percentage of job description keywords found (0-100)
        missingKeywords: string[]; //list of important keywords missing from resume
        tips: {
          type: "good" | "improve";
          tip: string; //specific actionable tip
          explanation: string; //detailed explanation of why this matters for ATS
          priority: "high" | "medium" | "low"; //how important this tip is
        }[]; //give 4-6 specific tips
      };
      toneAndStyle: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
          priority: "high" | "medium" | "low";
        }[]; //give 3-4 tips
      };
      content: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
          priority: "high" | "medium" | "low";
        }[]; //give 3-4 tips
      };
      structure: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
          priority: "high" | "medium" | "low";
        }[]; //give 3-4 tips
      };
      skills: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
          priority: "high" | "medium" | "low";
        }[]; //give 3-4 tips
      };
    }`;

export const prepareInstructions = ({
                                        jobTitle,
                                        jobDescription,
                                        AIResponseFormat,
                                    }: {
    jobTitle: string;
    jobDescription: string;
    AIResponseFormat: string;
}) =>
    `You are an expert ATS (Applicant Tracking System) specialist and professional resume reviewer with 15+ years of experience in HR and recruitment.

CRITICAL: You are analyzing this resume for a REAL job application. The overall score should reflect whether this resume would actually pass ATS screening and get the candidate an interview. Be brutally honest - most resumes score between 40-75 in real ATS systems.

OVERALL SCORE CALCULATION (This is the MOST IMPORTANT score):
- 85-100: EXCEPTIONAL - This resume would pass 95% of ATS systems, excellent keyword optimization, perfect formatting
- 75-84: EXCELLENT - Would pass 85% of ATS systems, strong keyword presence, very good structure
- 65-74: GOOD - Would pass 70% of ATS systems, adequate keywords, good structure
- 55-64: FAIR - Would pass 50% of ATS systems, some missing keywords, structure needs work
- 45-54: POOR - Would pass only 30% of ATS systems, many missing keywords, poor structure
- 35-44: VERY POOR - Would pass only 15% of ATS systems, critical issues
- Below 35: REJECTED - Would be automatically rejected by most ATS systems

ATS SCORING CRITERIA:
- 90-100: Perfect ATS optimization, all critical keywords present, flawless structure
- 80-89: Very good ATS optimization, strong keyword presence, excellent structure
- 70-79: Good ATS optimization, adequate keywords, good structure
- 60-69: Fair ATS optimization, some missing keywords, structure needs work
- 50-59: Poor ATS optimization, many missing keywords, poor structure
- Below 50: Very poor ATS optimization, critical issues

REAL-WORLD ANALYSIS:
1. Compare resume content with job description requirements
2. Check for industry-specific keywords and skills
3. Evaluate ATS-friendly formatting (no tables, images, fancy fonts)
4. Assess content relevance and specificity
5. Identify missing critical experiences or qualifications
6. Verify chronological order and consistency
7. Check for proper section headers and structure

JOB CONTEXT:
- Job Title: ${jobTitle}
- Job Description: ${jobDescription}

IMPORTANT SCORING RULES:
- If the resume is missing 3+ critical keywords from the job description, deduct 20-30 points
- If the resume has poor formatting (tables, images, fancy fonts), deduct 15-25 points
- If the resume lacks relevant experience for the job, deduct 25-35 points
- If the resume has excellent keyword matching and formatting, add 10-15 points
- Most real resumes score between 45-75 - be realistic!

Provide the feedback using the following format: ${AIResponseFormat}
Return ONLY the JSON object, no additional text or formatting.`;