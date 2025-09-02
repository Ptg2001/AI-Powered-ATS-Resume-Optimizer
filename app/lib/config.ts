import 'dotenv/config';
export const config = {
  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb+srv://piyushhole:Piyushhole2001@ecom.neu3z5n.mongodb.net/resumeAI?retryWrites=true&w=majority&appName=resumeAI&authSource=admin&directConnection=false",
    enabled: true,
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      // Do NOT default to localhost here; let routes compute from request origin if empty.
      redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
      scope: 'openid email profile',
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
          gemini: {
          apiKey: process.env.GOOGLE_API_KEY || 'AIzaSyAgpQXwZOGZyiUhYnAiFUKznJmR-J-ZMhU',
        },
        huggingface: {
          apiKey: process.env.HUGGINGFACEHUB_API_KEY,
        },

          pinecone: {
          apiKey: process.env.PINECONE_API_KEY,
          indexName: process.env.PINECONE_INDEX_NAME || 'resumind-chatbot',
        },
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760'), // 10MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'application/pdf').split(','),
  },
  server: {
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  chatbot: {
    enabled: process.env.CHATBOT_ENABLED === 'true',
    model: process.env.CHATBOT_MODEL || 'gemini-pro',
    maxTokens: parseInt(process.env.CHATBOT_MAX_TOKENS || '1000'),
    temperature: parseFloat(process.env.CHATBOT_TEMPERATURE || '0.7'),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
} as const;
