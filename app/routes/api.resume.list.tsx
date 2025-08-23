import { getDatabase } from "~/lib/db";
import { requireAuth } from "~/lib/middleware";
import { ObjectId } from "mongodb";

export async function loader({ request }: { request: Request }) {
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

  try {
    const db = await getDatabase();
    const resumesCollection = db.collection("resumes");

    // Get user's resumes, sorted by creation date (newest first)
    const resumes = await resumesCollection
      .find({ userId: new ObjectId(user.id) })
      .sort({ createdAt: -1 })
      .toArray();

    // Transform data for frontend
    const transformedResumes = resumes.map(resume => ({
      id: resume._id.toString(),
      companyName: resume.companyName,
      jobTitle: resume.jobTitle,
      fileName: resume.fileName,
      feedback: resume.feedback,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    }));

    return new Response(JSON.stringify({
      resumes: transformedResumes,
      count: transformedResumes.length,
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching resumes:', error);
    return new Response(JSON.stringify({ error: "Failed to fetch resumes" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
