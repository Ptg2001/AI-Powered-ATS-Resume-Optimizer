# RESUMIND - AI-Powered ATS Resume Optimizer

A modern, full-stack web application that helps users optimize their resumes for Applicant Tracking Systems (ATS) using AI-powered feedback.

![Resumind](https://img.shields.io/badge/Resumind-AI%20Powered%20ATS%20Optimizer-blue)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-6.18.0-green)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-orange)

## 🚀 Features

### Core Functionality
- **AI-Powered Resume Analysis**: Get detailed feedback on your resume using GPT-4
- **ATS Compatibility Scoring**: Understand how well your resume performs with Applicant Tracking Systems
- **Real-time Processing**: Upload PDF resumes and get instant AI feedback
- **Comprehensive Feedback**: Analysis across multiple categories:
  - ATS Compatibility
  - Content Quality
  - Structure & Format
  - Skills Assessment
  - Tone & Style

### User Experience
- **Modern UI/UX**: Beautiful, responsive design with TailwindCSS
- **Real-time Progress**: Visual progress indicators during resume processing
- **Toast Notifications**: Instant feedback for user actions
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Authentication**: Secure JWT-based authentication system

### Technical Features
- **Full-Stack**: React Router with server-side rendering
- **TypeScript**: Fully typed codebase for better development experience
- **MongoDB**: Scalable database for storing user data and resumes
- **File Upload**: Secure PDF upload with validation
- **PDF Processing**: Extract text from PDF files for analysis
- **Environment Configuration**: Secure configuration management

## 🛠️ Tech Stack

### Frontend
- **React 19** - Latest React with concurrent features
- **React Router 7** - Full-stack routing with SSR
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first CSS framework
- **PDF.js** - PDF text extraction

### Backend
- **Node.js** - Server runtime
- **MongoDB** - NoSQL database
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Multer** - File upload handling

### AI & External Services
- **OpenAI GPT-4** - Resume analysis and feedback
- **MongoDB Atlas** - Cloud database hosting

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account
- OpenAI API key

### 1. Clone the Repository
```bash
git clone <repository-url>
cd AI-Powered-ATS-Resume-Optimizer
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Update the `.env` file with your configuration:

```env
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/resumeAI?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# AI Service Configuration
OPENAI_API_KEY=your-openai-api-key-here

# File Storage Configuration
UPLOAD_MAX_SIZE=10485760
ALLOWED_FILE_TYPES=application/pdf

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 4. Start Development Server
```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## 🏗️ Project Structure

```
├── app/
│   ├── components/          # Reusable UI components
│   │   ├── Navbar.tsx      # Navigation bar
│   │   ├── ResumeCard.tsx  # Resume display card
│   │   ├── ScoreCircle.tsx # Circular score indicator
│   │   ├── LoadingSpinner.tsx # Loading component
│   │   ├── Toast.tsx       # Toast notifications
│   │   └── ErrorBoundary.tsx # Error handling
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.tsx # Authentication state
│   │   └── ToastContext.tsx # Toast notifications
│   ├── lib/               # Utility libraries
│   │   ├── auth.ts        # Authentication utilities
│   │   ├── db.ts          # Database connection
│   │   ├── ai.ts          # AI service integration
│   │   ├── pdf.ts         # PDF processing
│   │   ├── upload.ts      # File upload handling
│   │   ├── middleware.ts  # Authentication middleware
│   │   └── config.ts      # Configuration management
│   ├── routes/            # Application routes
│   │   ├── home.tsx       # Main dashboard
│   │   ├── auth.tsx       # Authentication page
│   │   ├── upload.tsx     # Resume upload page
│   │   ├── resume.$id.tsx # Resume detail page
│   │   └── api.*.tsx      # API endpoints
│   └── root.tsx           # Root component
├── constants/             # Application constants
├── types/                # TypeScript type definitions
├── public/               # Static assets
└── uploads/              # File upload directory
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Token verification

### Resume Management
- `POST /api/resume/upload` - Upload and analyze resume
- `GET /api/resume/list` - Get user's resumes
- `GET /api/resume/:id` - Get specific resume details

## 🚀 Deployment

### Docker Deployment
```bash
# Build the Docker image
docker build -t resumind .

# Run the container
docker run -p 3000:3000 resumind
```

### Manual Deployment
1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the `build/` directory to your hosting platform

3. Set environment variables on your hosting platform

### Supported Platforms
- **Vercel** - Zero-config deployment
- **Netlify** - Static site hosting
- **Railway** - Full-stack deployment
- **Heroku** - Container deployment
- **AWS ECS** - Container orchestration
- **Google Cloud Run** - Serverless containers

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Input Validation**: Comprehensive validation on all inputs
- **File Upload Security**: Type and size validation
- **Environment Variables**: Secure configuration management
- **CORS Protection**: Cross-origin request protection
- **Rate Limiting**: API rate limiting (configurable)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🎯 Roadmap

- [ ] Resume comparison feature
- [ ] Multiple resume templates
- [ ] Export functionality
- [ ] Advanced analytics
- [ ] Integration with job boards
- [ ] Mobile app development
- [ ] Team collaboration features

---

Built with ❤️ using modern web technologies
