import { config } from './config';
import { Pinecone } from '@pinecone-database/pinecone';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } from '@langchain/core/prompts';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';

export interface ChatbotMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatbotResponse {
  message: string;
  confidence: number;
  suggestions?: string[];
  error?: string;
}

// Check required environment variables
if (!config.gemini?.apiKey) throw new Error('Missing GOOGLE_API_KEY');

const pinecone = config.pinecone?.apiKey ? new Pinecone({ 
  apiKey: config.pinecone.apiKey
}) : null;



async function getRetriever() {
  try {
    if (!pinecone || !config.pinecone?.apiKey) {
      throw new Error('Pinecone not configured');
    }
    
    const index = pinecone.Index(config.pinecone?.indexName || 'resumind-chatbot');
    
    // Check if HuggingFace API key is available
    if (config.huggingface?.apiKey) {
      console.log('Using HuggingFace embeddings for Pinecone search');
      
      // Use proper HuggingFace embeddings like in the reference implementation
      const embeddings = new HuggingFaceInferenceEmbeddings({ 
        apiKey: config.huggingface.apiKey, 
        model: 'sentence-transformers/all-MiniLM-L6-v2'
      });
      
      return {
        getRelevantDocuments: async (input: string) => {
          try {
            console.log('Generating embeddings for:', input);
            
            // Generate proper vector embeddings
            const vector = await embeddings.embedQuery(input);
            console.log('Generated vector of length:', vector.length);
            
            // Query Pinecone with proper vector
            const queryResponse = await index.query({
              vector: vector,
              topK: 3,
              includeMetadata: true,
            });
            
            console.log('Pinecone response:', queryResponse);
            
            if (queryResponse.matches && queryResponse.matches.length > 0) {
              const docs = queryResponse.matches.map(match => ({
                pageContent: match.metadata?.text || match.metadata?.content || match.metadata?.chunk_text || 'No content available'
              }));
              console.log('Found documents:', docs.length);
              return docs;
            }
            
            console.log('No Pinecone matches found');
            return [];
          } catch (error) {
            console.error('Pinecone query error:', error);
            return [];
          }
        }
      };
    } else {
      console.log('HuggingFace API key not available, using simple text search');
      
      // Fallback to simple text-based search
      return {
        getRelevantDocuments: async (input: string) => {
          try {
            console.log('Using simple text search for:', input);
            
            // Simple text-based search in Pinecone (this might not work perfectly but gives us a fallback)
            const queryResponse = await index.query({
              vector: input.toLowerCase().split(' ').slice(0, 10) as any,
              topK: 3,
              includeMetadata: true,
            });
            
            console.log('Pinecone response:', queryResponse);
            
            if (queryResponse.matches && queryResponse.matches.length > 0) {
              const docs = queryResponse.matches.map(match => ({
                pageContent: match.metadata?.text || match.metadata?.content || match.metadata?.chunk_text || 'No content available'
              }));
              console.log('Found documents:', docs.length);
              return docs;
            }
            
            console.log('No Pinecone matches found');
            return [];
          } catch (error) {
            console.error('Pinecone query error:', error);
            return [];
          }
        }
      };
    }
  } catch (error) {
    console.error('Error creating retriever:', error);
    throw error;
  }
}

const systemPrompt = `You are Resumind AI Assistant, an expert in resume optimization and ATS (Applicant Tracking System) best practices. 

Your expertise includes:
- Resume optimization for ATS systems
- Keyword matching and optimization
- Resume formatting and structure
- Content improvement strategies
- Common resume mistakes to avoid

Use the following pieces of retrieved context to answer the question. If you don't know the answer, say that you don't know. Use three sentences maximum and keep the answer concise and actionable.

Always provide helpful, actionable advice. If the user asks about specific resume analysis, remind them to upload their resume through the Resumind platform for detailed AI analysis.

Keep responses concise, professional, and focused on resume optimization.`;

async function buildChain() {
  try {
    const retriever = await getRetriever();
    const model = new ChatGoogleGenerativeAI({ 
      model: 'gemini-1.5-flash', 
      apiKey: config.gemini.apiKey 
    });
    
    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(systemPrompt + '\n\n{context}'),
      HumanMessagePromptTemplate.fromTemplate('{input}')
    ]);
    
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    
    return async (input: string) => {
      try {
        const docs = await retriever.getRelevantDocuments(input);
        const context = docs.map((d: any) => d.pageContent).join('\n\n');
        
        if (!context || context.trim() === '') {
          // If no Pinecone context, use Gemini directly
          console.log('No Pinecone context found, using Gemini directly');
          return await generateGeminiOnlyResponse(input);
        }
        
        const text = await chain.invoke({ context, input });
        return text;
      } catch (error) {
        console.error('Chain execution error:', error);
        // Fallback to Gemini directly
        return await generateGeminiOnlyResponse(input);
      }
    };
  } catch (error) {
    console.error('Error building chain:', error);
    // Return a simple function that uses Gemini directly
    return async (input: string) => {
      return await generateGeminiOnlyResponse(input);
    };
  }
}

let chainPromise: Promise<any> | null = null;

export function getRagChain() {
  if (!chainPromise) {
    chainPromise = buildChain();
  }
  return chainPromise;
}

// Enhanced response generation with RAG
export async function generateChatbotResponse(
  userMessage: string,
  conversationHistory: ChatbotMessage[] = []
): Promise<ChatbotResponse> {
  try {
    console.log('Attempting to use RAG chain for:', userMessage);
    
    // Use RAG chain for intelligent responses
    const chain = await getRagChain();
    console.log('RAG chain created successfully');
    
    const aiResponse = await chain(userMessage);
    console.log('RAG response received:', aiResponse);

    return {
      message: aiResponse,
      confidence: 0.95, // High confidence with RAG
      suggestions: generateSuggestions(userMessage)
    };
  } catch (error) {
    console.error('Chatbot response generation error:', error);
    console.log('Using Gemini-only response for now');
    
    // Use Gemini directly for immediate responses
    const geminiResponse = await generateGeminiOnlyResponse(userMessage);
    return {
      message: geminiResponse,
      confidence: 0.9,
      suggestions: generateSuggestions(userMessage)
    };
  }
}

async function generateGeminiOnlyResponse(userMessage: string): Promise<string> {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are Resumind AI Assistant, an expert in resume optimization and ATS (Applicant Tracking System) best practices. 

Answer this question about resume optimization: ${userMessage}

Keep your response concise, professional, and focused on resume optimization. Use 2-3 sentences maximum.`;

    const result = await model.generateContent(prompt);
    return result.response.text() || 'I apologize, but I couldn\'t generate a response at this time.';
  } catch (error) {
    console.error('Gemini-only response error:', error);
    throw error;
  }
}

async function generateLocalResponse(userMessage: string): Promise<ChatbotResponse> {
  const lowerMessage = userMessage.toLowerCase();
  
  // Resume optimization questions
  if (lowerMessage.includes('how to improve') || lowerMessage.includes('optimize') || lowerMessage.includes('better score')) {
    return {
      message: `To improve your ATS score:

1. **Include relevant keywords** from the job description
2. **Use simple formatting** - avoid tables, images, fancy fonts
3. **Use standard section headers** (Experience, Education, Skills)
4. **Quantify achievements** with numbers and percentages
5. **Use action verbs** to start bullet points
6. **Keep content relevant** to the specific job
7. **Proofread carefully** for spelling and grammar errors

For detailed analysis of your specific resume, please upload it through our platform.`,
      confidence: 0.85,
      suggestions: ['Upload resume for analysis', 'Learn about ATS scoring', 'Get formatting tips']
    };
  }

  if (lowerMessage.includes('keywords') || lowerMessage.includes('important words')) {
    return {
      message: `Focus on these types of keywords:

• **Technical skills** and technologies mentioned in the job description
• **Industry-specific terminology**
• **Required qualifications** and certifications
• **Action verbs** and achievement-oriented language
• **Company-specific terms** or tools

Missing key terms can cause your resume to be automatically rejected by ATS systems.`,
      confidence: 0.9,
      suggestions: ['Learn about ATS systems', 'Get formatting tips', 'Upload resume for keyword analysis']
    };
  }

  if (lowerMessage.includes('format') || lowerMessage.includes('structure') || lowerMessage.includes('layout')) {
    return {
      message: `For ATS-friendly formatting:

✅ **Use standard fonts**: Arial, Calibri, Times New Roman
✅ **Simple bullet points**
✅ **Standard section headers**: Experience, Education, Skills
✅ **Consistent formatting**
✅ **White space** for readability

❌ **Avoid**: Tables, images, graphics, fancy fonts, complex layouts`,
      confidence: 0.95,
      suggestions: ['Upload resume for formatting analysis', 'Learn about ATS scoring', 'Get content tips']
    };
  }

  if (lowerMessage.includes('score') || lowerMessage.includes('rating') || lowerMessage.includes('grade')) {
    return {
      message: `Resumind scores range from 0-100:

🏆 **85-100: EXCEPTIONAL** - Passes 95% of ATS systems
✨ **75-84: EXCELLENT** - Passes 85% of ATS systems
👍 **65-74: GOOD** - Passes 70% of ATS systems
⚠️ **55-64: FAIR** - Passes 50% of ATS systems
⚠️ **45-54: POOR** - Passes only 30% of ATS systems
❌ **Below 45: VERY POOR** - Likely to be rejected

Most real resumes score between 45-75.`,
      confidence: 0.9,
      suggestions: ['Upload resume for scoring', 'Learn improvement tips', 'Get ATS best practices']
    };
  }

  if (lowerMessage.includes('upload') || lowerMessage.includes('file') || lowerMessage.includes('pdf')) {
    return {
      message: `To upload your resume:

1. Click 'Upload New Resume' on your dashboard
2. Fill in: Company name, Job title, Job description
3. Upload your PDF or DOCX file
4. Wait 30-60 seconds for AI analysis
5. Review your scores and improvement tips

Supported formats: PDF, DOCX (max 10MB)`,
      confidence: 0.95,
      suggestions: ['Go to upload page', 'Learn about supported formats', 'Get optimization tips']
    };
  }

  if (lowerMessage.includes('ats') || lowerMessage.includes('tracking system')) {
    return {
      message: `ATS (Applicant Tracking System) is software used by companies to screen job applications. It:

• **Scans resumes** for keywords and formatting
• **Filters applications** before human review
• **Ranks candidates** based on match criteria
• **Rejects resumes** that don't meet requirements

Your resume must pass ATS screening before a human ever sees it!`,
      confidence: 0.9,
      suggestions: ['Learn optimization tips', 'Upload resume for analysis', 'Get keyword guidance']
    };
  }

  if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('assistance')) {
    return {
      message: `I can help you with:

📝 **Resume optimization tips**
🎯 **ATS best practices**
📊 **Understanding your scores**
🔧 **Technical issues**
📚 **Resume writing guidance**

Just ask me any question about resumes, ATS systems, or using Resumind!`,
      confidence: 0.9,
      suggestions: ['Learn about ATS scoring', 'Get formatting tips', 'Upload resume for analysis']
    };
  }

  // Default response
  return {
    message: `I understand you're asking about resume optimization. While I can provide general guidance on ATS best practices, resume formatting, and optimization tips, for specific analysis of your resume, please upload it through our platform.

I can help you with:
• Resume optimization strategies
• ATS compatibility tips
• Formatting best practices
• Keyword optimization
• Common resume mistakes to avoid

What specific aspect would you like to know more about?`,
    confidence: 0.7,
    suggestions: ['Upload resume for analysis', 'Learn about ATS systems', 'Get optimization tips']
  };
}

function generateSuggestions(userMessage: string): string[] {
  const suggestions = [
    'Upload resume for analysis',
    'Learn about ATS scoring',
    'Get formatting tips',
    'Learn keyword optimization',
    'Get content improvement tips'
  ];
  
  // Return 3 random suggestions
  return suggestions.sort(() => 0.5 - Math.random()).slice(0, 3);
}

// Rate limiting for chatbot requests
const requestCounts = new Map<string, number>();
const requestTimestamps = new Map<string, number>();

export function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = config.rateLimit?.windowMs || 900000; // 15 minutes
  const maxRequests = config.rateLimit?.maxRequests || 100;
  
  const userTimestamp = requestTimestamps.get(userId) || 0;
  const userCount = requestCounts.get(userId) || 0;
  
  if (now - userTimestamp > windowMs) {
    // Reset counter for new window
    requestCounts.set(userId, 1);
    requestTimestamps.set(userId, now);
    return true;
  }
  
  if (userCount >= maxRequests) {
    return false;
  }
  
  requestCounts.set(userId, userCount + 1);
  return true;
}
