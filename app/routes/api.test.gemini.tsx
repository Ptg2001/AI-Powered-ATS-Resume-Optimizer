import { GoogleGenAI } from '@google/genai';
import { config } from '~/lib/config';

export async function action() {
  try {
    if (!config.gemini.apiKey) {
      return new Response(JSON.stringify({ 
        error: 'Gemini API key not configured',
        config: { hasApiKey: false }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const ai = new GoogleGenAI({
      apiKey: config.gemini.apiKey,
    });
    
    // Test with a simple prompt
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Say 'Hello World' in JSON format: {\"message\": \"Hello World\"}",
    });
    const text = response.text;

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Gemini API is working!',
      response: text,
      config: { 
        hasApiKey: true,
        apiKeyLength: config.gemini.apiKey.length,
        apiKeyPrefix: config.gemini.apiKey.substring(0, 10) + '...'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Gemini test error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Gemini API test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      config: { 
        hasApiKey: !!config.gemini.apiKey,
        apiKeyLength: config.gemini.apiKey?.length || 0
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
