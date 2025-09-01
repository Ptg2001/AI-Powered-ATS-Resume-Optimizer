import { requireAuth } from "~/lib/middleware";
import { generateChatbotResponse, checkRateLimit, type ChatbotMessage } from "~/lib/chatbot";
import { config } from "~/lib/config";

export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check if chatbot is enabled
  if (!config.chatbot.enabled) {
    return new Response(JSON.stringify({ error: "Chatbot is currently disabled" }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check if user is authenticated (optional for chatbot)
  let userId = 'anonymous';
  try {
    const authResult = await requireAuth(async (req: Request) => req)(request);
    if (authResult instanceof Response) {
      // User not authenticated, continue as anonymous
      console.log('Chatbot request from anonymous user');
    } else {
      // User is authenticated
      const user = (request as any).user;
      userId = user.id;
    }
  } catch (error) {
    // Continue as anonymous user
    console.log('Chatbot request from anonymous user (auth error)');
  }

  try {
    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check rate limiting
    if (!checkRateLimit(userId)) {
      return new Response(JSON.stringify({ 
        error: "Rate limit exceeded. Please try again later." 
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate chatbot response
    const response = await generateChatbotResponse(message, conversationHistory);

    return new Response(JSON.stringify({
      message: response.message,
      confidence: response.confidence,
      suggestions: response.suggestions,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Chatbot API error:', error);
    return new Response(JSON.stringify({ 
      error: "Internal server error. Please try again." 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
