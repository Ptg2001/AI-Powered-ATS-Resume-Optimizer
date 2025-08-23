export const config = {
  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://piyushhole:Piyushhole2001@ecom.neu3z5n.mongodb.net:27017/resumeAI?retryWrites=true&w=majority",
    enabled: true,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || 'AIzaSyAgpQXwZOGZyiUhYnAiFUKznJmR-J-ZMhU',
  },
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760'), // 10MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'application/pdf').split(','),
  },
  server: {
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
} as const;
