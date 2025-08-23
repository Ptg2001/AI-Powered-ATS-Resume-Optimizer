import { getDatabase } from "~/lib/db";
import { requireAuth } from "~/lib/middleware";
import { ObjectId } from "mongodb";

export async function loader({ request, params }: { request: Request; params: { id: string } }) {
  if (request.method !== "GET") {
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
  const resumeId = params.id;

  // Validate resume ID
  if (!ObjectId.isValid(resumeId)) {
    return new Response(JSON.stringify({ error: "Invalid resume ID" }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const db = await getDatabase();
    const resumesCollection = db.collection("resumes");

    // Get resume by ID and ensure it belongs to the user
    const resume = await resumesCollection.findOne({
      _id: new ObjectId(resumeId),
      userId: new ObjectId(user.id)
    });

    if (!resume) {
      return new Response(JSON.stringify({ error: "Resume not found" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Transform data for frontend
    const transformedResume = {
      id: resume._id.toString(),
      companyName: resume.companyName,
      jobTitle: resume.jobTitle,
      jobDescription: resume.jobDescription,
      fileName: resume.fileName,
      fileSize: resume.fileSize,
      resumeText: resume.resumeText,
      feedback: resume.feedback,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    };

    return new Response(JSON.stringify(transformedResume), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching resume:', error);
    return new Response(JSON.stringify({ error: "Failed to fetch resume" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
