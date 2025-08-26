import { getDatabase } from "~/lib/db";
import { requireAuth } from "~/lib/middleware";
import { ObjectId } from "mongodb";
import { analyzeResume } from "~/lib/ai";

export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const authResult = await requireAuth(async (req: Request) => req)(request);
  if (authResult instanceof Response) return authResult;

  try {
    const form = await request.formData();
    const resumeId = form.get('resumeId') as string;
    const jobDescription = (form.get('jobDescription') as string) || '';

    if (!resumeId) {
      return new Response(JSON.stringify({ error: 'resumeId is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!ObjectId.isValid(resumeId)) {
      return new Response(JSON.stringify({ error: 'Invalid resumeId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const db = await getDatabase();
    const resumes = db.collection('resumes');
    const existing = await resumes.findOne({ _id: new ObjectId(resumeId) });
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Resume not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const feedback = await analyzeResume({
      resumeText: existing.resumeText || '',
      jobTitle: existing.jobTitle || '',
      jobDescription: jobDescription || existing.jobDescription || '',
    });

    await resumes.updateOne({ _id: new ObjectId(resumeId) }, { $set: { feedback, jobDescription: jobDescription || existing.jobDescription, updatedAt: new Date() } });

    return new Response(JSON.stringify({ ok: true, feedback }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Reanalysis failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}


