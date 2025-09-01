import { getDatabase } from "~/lib/db";

export async function loader() {
  try {
    const db = await getDatabase();
    await db.admin().ping();
    
    return new Response(JSON.stringify({ 
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Health check failed:", error);
    
    return new Response(JSON.stringify({ 
      status: "unhealthy",
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
