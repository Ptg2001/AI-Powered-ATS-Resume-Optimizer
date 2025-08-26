import { getDatabase } from "~/lib/db";
import { requireAuth } from "~/lib/middleware";
import { analyzeResume } from "~/lib/ai";
import { ObjectId } from "mongodb";

export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const authResult = await requireAuth(async (req: Request) => req)(request);
  if (authResult instanceof Response) {
    return authResult;
  }

  const user = (request as any).user;

  try {
    const formData = await request.formData();
    const company = formData.get('company') as string;
    const jobTitle = formData.get('jobTitle') as string;
    const jobDescription = formData.get('jobDescription') as string;
    const resumeText = formData.get('resumeText') as string;
    const fileName = formData.get('fileName') as string;
    const fileSize = formData.get('fileSize') as string;
    const resumeFile = formData.get('resume') as File | null;

    if (!company || !jobTitle || !jobDescription || !resumeText || !fileName) {
      return new Response(JSON.stringify({ error: "All fields are required" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (resumeText.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Could not extract text from PDF. Please ensure the file is not corrupted or password-protected." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (resumeText.trim().length < 100) {
      return new Response(JSON.stringify({ error: "Extracted text is too short. The document might be image-based or corrupted." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const words = resumeText.split(/\s+/);
    const validWords = words.filter(word => word.length > 0 && /[a-zA-Z]/.test(word));
    if (validWords.length < 10) {
      return new Response(JSON.stringify({ error: "Extracted text contains insufficient meaningful content. Please try a different document." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing resume with ${validWords.length} valid words and ${resumeText.length} total characters`);

    const analysis = await analyzeResume({
      resumeText,
      jobTitle,
      jobDescription,
    });

    const db = await getDatabase();
    const resumesCollection = db.collection("resumes");

    // Persist original file as base64 for preview (PDF only)
    let originalBase64: string | null = null;
    if (resumeFile) {
      const buf = Buffer.from(await resumeFile.arrayBuffer());
      originalBase64 = `data:${resumeFile.type};base64,${buf.toString('base64')}`;
    }

    const resumeData = {
      userId: new ObjectId(user.id),
      companyName: company,
      jobTitle: jobTitle,
      jobDescription: jobDescription,
      resumeText: resumeText,
      fileName: fileName,
      fileSize: parseInt(fileSize || '0'),
      originalFile: originalBase64, // base64 data URL for client preview
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
    if (error instanceof Error) errorMessage = error.message;

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
