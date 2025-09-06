import type { Route } from "./+types/home";
import React, { useEffect, useState } from "react";
import { useAuth } from "~/contexts/AuthContext";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import { Link } from "react-router";
import GradientTyping from "~/components/GradientTyping";
import { ArrowDown } from "lucide-react";
import Chatbot from "~/components/Chatbot";
import ChatbotToggle from "~/components/ChatbotToggle";


interface Resume {
  id: string;
  companyName: string;
  jobTitle: string;
  fileName: string;
  feedback: any;
  createdAt: string;
  updatedAt: string;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind - Dashboard" },
    { name: "description", content: "Smart Feedback for your dream Job" },
  ];
}

export default function Home() {
  const { isAuthenticated, token } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchResumes();
    } else {
      // User logged out: clear any previously loaded data immediately
      setResumes([]);
      setError(null);
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  const fetchResumes = async () => {
    try {
      const response = await fetch('/api/resume/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResumes(data.resumes || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch resumes');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/resume/delete?id=${resumeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Remove the deleted resume from the list
        setResumes(prevResumes => prevResumes.filter(resume => resume.id !== resumeId));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete resume');
      }
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  };

  // Calculate statistics
  const totalResumes = resumes.length;
  const averageScore = resumes.length > 0 
    ? Math.round(resumes.reduce((sum, resume) => sum + (resume.feedback?.overallScore || 0), 0) / resumes.length)
    : 0;
  const highScores = resumes.filter(resume => (resume.feedback?.overallScore || 0) >= 75).length;
  const recentUploads = resumes.filter(resume => {
    const uploadDate = new Date(resume.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return uploadDate >= weekAgo;
  }).length;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50';
    if (score >= 60) return 'bg-yellow-50';
    return 'bg-red-50';
  };

// logic for scroll button disappear
  const [useScroll, setUseScroll] = useState(true);

    useEffect(() => {

        const timer = setTimeout(() => {
          setUseScroll(false);
        }, 10000);

        const handleScroll = () => {
          if (window.scrollY > 50) {
            setUseScroll(false);
            clearTimeout(timer);
          }
        };
      window.addEventListener("scroll", handleScroll);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("scroll", handleScroll);
      }
  }, []);

  // --- Unauthenticated landing ---
  if (!isAuthenticated) {
    return (
      <main className="bg-gradient-two min-h-screen">
        <Navbar />
        <ChatbotToggle onClick={() => setIsChatbotOpen(true)} isOpen={isChatbotOpen} />
        <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
        <section className="relative overflow-hidden mt-15 animate-fade-in-delay-2">
          <div className="absolute inset-0 bg-gradient-two animate-fade-in-delay-2"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mt-10">
                Optimize your resume for real ATS screening
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed mt-10">
                Resumind analyzes your resume like an ATS, extracts keywords from the job description, and gives actionable fixes so you get more callbacks.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
                <Link to="/auth" className="inline-flex items-center justify-center primary-button font-bold px-6 py-4">
                  Sign in to Get Started
                </Link>
                <Link to="/upload" className="inline-flex items-center justify-center white-button font-bold px-6 py-4">
                  Try the Analyzer
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold">Accurate Parsing</h3>
              <p className="text-gray-600 mt-2">Advanced PDF/DOCX parsing with OCR fallback recovers text from complex resumes.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold">Job‑Aware Scoring</h3>
              <p className="text-gray-600 mt-2">Blends AI judgment with real keyword match and structure checks for realistic scores.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold">Actionable Fixes</h3>
              <p className="text-gray-600 mt-2">Concrete, prioritized suggestions to improve ATS pass rate and readability.</p>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 text-center">How it works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="p-4">
                <div className="text-sm text-gray-500 mb-1">Step 1</div>
                <div className="font-semibold">Upload your resume</div>
                <p className="text-gray-600 mt-2">PDF or DOCX. We extract text precisely, including LaTeX exports.</p>
              </div>
              <div className="p-4">
                <div className="text-sm text-gray-500 mb-1">Step 2</div>
                <div className="font-semibold">Paste a job description</div>
                <p className="text-gray-600 mt-2">We detect critical keywords and assess relevance and structure.</p>
              </div>
              <div className="p-4">
                <div className="text-sm text-gray-500 mb-1">Step 3</div>
                <div className="font-semibold">Get targeted fixes</div>
                <p className="text-gray-600 mt-2">Receive prioritized tips to raise your ATS score and pass rate.</p>
              </div>
            </div>
            <div className="flex justify-center mt-8">
              <Link to="/auth" className="primary-button font-bold px-8 py-4">Start Free</Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // --- Authenticated dashboard ---
  return (
    <main className="bg-gradient-two min-h-screen">
      <Navbar />
      <ChatbotToggle onClick={() => setIsChatbotOpen(true)} isOpen={isChatbotOpen} />
      <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
      {/* Hero Section */}
      <section className="relative overflow-hidden mt-15 animate-fade-in-delay-2">
        <div className="absolute inset-0 bg-gradient-two animate-fade-in-delay-2"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mt-10">
              Welcome to {" "}
              <span className="inline-block w-[9ch]">
                <GradientTyping text="Resumind" speed={500} />
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed mt-10">
              Your AI-powered resume optimization dashboard. Track applications, analyze ATS scores, and get professional feedback to land your dream job.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-20">
              <Link 
                to="/upload" 
                className="inline-flex items-center justify-center primary-button font-bold px-4 py-5 md:px-12 md:py-5 button-hover animate-fade-in-delay-2"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Upload New Resume
              </Link>
              <button 
                onClick={fetchResumes}
                className="inline-flex items-center justify-center white-button font-bold px-4 py-5 md:px-18 md:py-5 button-hover animate-fade-in-delay-2"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </section>

      {useScroll && (
            <div 
                className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center cursor-pointer mt-8 scroll-indicator animate-disappear-scroll"
            >
                <span className="text-sm text-muted-foreground mb-2"> Scroll </span>
                <ArrowDown className="h-5 w-5 text-black" />
            </div>
      )}

      {/* Statistics Dashboard */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 mt-30">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Resumes */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-appear-clip-path">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Resumes</p>
                <p className="text-3xl font-bold text-gray-900">{totalResumes}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Average Score */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-appear-clip-path">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className={`text-3xl font-bold ${getScoreColor(averageScore)}`}>{averageScore}/100</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* High Scores */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-appear-clip-path">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Scores (75+)</p>
                <p className="text-3xl font-bold text-green-600">{highScores}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Recent Uploads */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-appear-clip-path">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-3xl font-bold text-purple-600">{recentUploads}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-appear-scale">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your Resume Collection</h2>
                <p className="text-gray-600 mt-1">Manage and review your uploaded resumes</p>
              </div>
              <Link 
                to="/upload" 
                className="inline-flex items-center justify-center primary-button font-bold text-xs sm:text-sm md:text-base"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Resume
              </Link>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-6 text-lg text-gray-600">Loading your resumes...</p>
                  <p className="text-sm text-gray-500 mt-2">Please wait while we fetch your data</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center py-16">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-lg text-red-600 mb-4">{error}</p>
                  <button 
                    onClick={fetchResumes}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                  </button>
                </div>
              </div>
            ) : resumes.length > 0 ? (
              <div className="max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                <div className="space-y-6">
                  {resumes.map((resume) => (
                    <ResumeCard 
                      key={resume.id} 
                      resume={resume} 
                      onDelete={handleDeleteResume}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center py-16">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No resumes yet</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Get started by uploading your first resume. Our AI will analyze it and provide detailed feedback to help you optimize for ATS systems.
                  </p>
                  <Link 
                    to="/upload" 
                    className="inline-flex items-center justify-center primary-button font-bold text-xs sm:text-sm md:text-base button-hover"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Upload Your First Resume
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

