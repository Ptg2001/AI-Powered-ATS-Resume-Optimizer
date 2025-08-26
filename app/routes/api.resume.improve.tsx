import { getDatabase } from "~/lib/db";
import { requireAuth } from "~/lib/middleware";
import { GoogleGenAI } from "@google/genai";
import { config } from "~/lib/config";
import { ObjectId } from "mongodb";

export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const authResult = await requireAuth(async (req: Request) => req)(request);
  if (authResult instanceof Response) {
    return authResult;
  }

  if (!config.gemini.apiKey) {
    return new Response(JSON.stringify({ error: "Gemini API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const form = await request.formData();
    const resumeId = form.get("resumeId") as string;

    if (!resumeId) {
      return new Response(JSON.stringify({ error: "resumeId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = await getDatabase();
    const resumes = db.collection("resumes");
    const doc = await resumes.findOne({ _id: new ObjectId(resumeId) });

    if (!doc) {
      return new Response(JSON.stringify({ error: "Resume not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resumeText: string = doc.resumeText || "";
    const jobTitle: string = doc.jobTitle || "";
    const jobDescription: string = doc.jobDescription || "";

    const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });

    const system = `You are an expert resume writer and ATS optimization specialist.
Rewrite the given resume into a clean, ATS-friendly, single-column format, tailored to the job below.
Rules:
- Keep content truthful; reword, reorganize, quantify where reasonable, but do not invent employment.
- Use standard section headers: Summary, Skills, Experience, Projects, Education, Achievements (only if applicable).
- Prefer bullet points starting with strong action verbs; include metrics when available from the text.
- Use simple typography (no tables, no icons), and plain text/markdown.
- Optimize for keywords from the job description naturally.
- Keep to 1–2 pages of concise text.
Return only the improved resume as plain text/markdown, no code fences.`;

    const prompt = `${system}

Job Title: ${jobTitle}
Job Description:
${jobDescription}

Original Resume Text:
${resumeText}`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: prompt,
    });

    const improved = (response.text || "").replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ""));

    if (!improved || improved.trim().length < 50) {
      return new Response(JSON.stringify({ error: "AI could not generate improved resume. Try again." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ improvedText: improved.trim() }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Improve resume error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate improved resume" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

