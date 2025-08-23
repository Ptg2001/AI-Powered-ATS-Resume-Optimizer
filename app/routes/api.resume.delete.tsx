import { getDatabase } from "~/lib/db";
import { requireAuth } from "~/lib/middleware";
import { ObjectId } from "mongodb";

export async function action({ request }: { request: Request }) {
  if (request.method !== "DELETE") {
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
    // Get resume ID from URL params
    const url = new URL(request.url);
    const resumeId = url.searchParams.get('id');

    if (!resumeId) {
      return new Response(JSON.stringify({ error: "Resume ID is required" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(resumeId)) {
      return new Response(JSON.stringify({ error: "Invalid resume ID format" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = await getDatabase();
    const resumesCollection = db.collection("resumes");

    // Find the resume and verify ownership
    const resume = await resumesCollection.findOne({
      _id: new ObjectId(resumeId),
      userId: new ObjectId(user.id)
    });

    if (!resume) {
      return new Response(JSON.stringify({ error: "Resume not found or access denied" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete the resume
    const result = await resumesCollection.deleteOne({
      _id: new ObjectId(resumeId),
      userId: new ObjectId(user.id)
    });

    if (result.deletedCount === 0) {
      return new Response(JSON.stringify({ error: "Failed to delete resume" }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      message: "Resume deleted successfully",
      deletedResumeId: resumeId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Resume deletion error:', error);
    
    let errorMessage = 'Failed to delete resume';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

