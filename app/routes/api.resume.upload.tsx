import { getDatabase } from "~/lib/db";
import { requireAuth } from "~/lib/middleware";
import { analyzeResume } from "~/lib/ai";
import { ObjectId } from "mongodb";

// No file upload handling needed - PDF processing is done client-side

export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Authenticate user
  const authResult = await requireAuth(async (req: Request) => req)(request);
  if (authResult instanceof Response) {
    return authResult;
  }

  const user = (request as any).user;

  try {
    // Handle file upload
    const formData = await request.formData();
    const company = formData.get('company') as string;
    const jobTitle = formData.get('jobTitle') as string;
    const jobDescription = formData.get('jobDescription') as string;
    const resumeText = formData.get('resumeText') as string; // Text extracted on client side
    const fileName = formData.get('fileName') as string;
    const fileSize = formData.get('fileSize') as string;

    // Validate required fields
    if (!company || !jobTitle || !jobDescription || !resumeText || !fileName) {
      return new Response(JSON.stringify({ error: "All fields are required" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate resume text
    if (resumeText.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Could not extract text from PDF. Please ensure the file is not corrupted or password-protected." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Analyze resume with AI
    const analysis = await analyzeResume({
      resumeText,
      jobTitle,
      jobDescription,
    });

    // Save to database
    const db = await getDatabase();
    const resumesCollection = db.collection("resumes");

    const resumeData = {
      userId: new ObjectId(user.id),
      companyName: company,
      jobTitle: jobTitle,
      jobDescription: jobDescription,
      resumeText: resumeText,
      fileName: fileName,
      fileSize: parseInt(fileSize || '0'),
      feedback: analysis,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await resumesCollection.insertOne(resumeData);

    return new Response(JSON.stringify({
      message: "Resume uploaded and analyzed successfully",
      resumeId: result.insertedId.toString(),
      feedback: analysis,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Resume upload error:', error);

    let errorMessage = 'Failed to upload and analyze resume';
    
    if (error instanceof Error) {
      if (error.message.includes('Gemini API key')) {
        errorMessage = 'AI service is not configured. Please check your Gemini API key.';
      } else if (error.message.includes('Failed to process PDF')) {
        errorMessage = 'Failed to process PDF file. Please ensure it is not corrupted.';
      } else if (error.message.includes('Failed to analyze resume')) {
        errorMessage = 'AI analysis failed. Please try again.';
      } else {
        errorMessage = error.message;
      }
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
