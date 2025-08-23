import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { useAuth } from '~/contexts/AuthContext';
import Navbar from '~/components/Navbar';
import ScoreCircle from '~/components/ScoreCircle';

interface ResumeDetail {
  id: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  fileName: string;
  fileSize: number;
  resumeText: string;
  feedback: any;
  createdAt: string;
  updatedAt: string;
}

const ResumeDetail = () => {
  const { id } = useParams();
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const [resume, setResume] = useState<ResumeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (id) {
      fetchResumeDetail();
    }
  }, [id, isAuthenticated, token]);

  const fetchResumeDetail = async () => {
    try {
      const response = await fetch(`/api/resume/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResume(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch resume details');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!resume) return;
    
    if (confirm(`Are you sure you want to delete this resume for ${resume.companyName} - ${resume.jobTitle}?`)) {
      try {
        const response = await fetch(`/api/resume/delete?id=${resume.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          // Navigate back to home page after successful deletion
          navigate('/');
        } else {
          const errorData = await response.json();
          alert(errorData.error || 'Failed to delete resume');
        }
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete resume. Please try again.');
      }
    }
  };

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

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <main className="bg-[url('/images/bg-main.svg')] bg-cover">
        <Navbar />
        <div className="main-section">
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading resume details...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !resume) {
    return (
      <main className="bg-[url('/images/bg-main.svg')] bg-cover">
        <Navbar />
        <div className="main-section">
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error || 'Resume not found'}</p>
              <Link to="/" className="primary-button w-fit px-6 py-2">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <div className="main-section">
        {/* Header */}
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/" className="back-button">
              <img src="/icons/back.svg" alt="Back" className="w-4 h-4" />
              <span>Back to Resumes</span>
            </Link>
          </div>

                     {/* Resume Info */}
           <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm">
             
             {/* Overall Score Explanation */}
             <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                   <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                   </svg>
                 </div>
                 <h3 className="text-xl font-bold text-gray-900">Overall ATS Score Analysis</h3>
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Score Display */}
                 <div className="bg-white rounded-lg p-4 shadow-sm">
                   <div className="text-center">
                     <div className="text-3xl font-bold mb-2" style={{
                       color: resume.feedback.overallScore >= 85 ? "#10B981" :
                              resume.feedback.overallScore >= 75 ? "#059669" :
                              resume.feedback.overallScore >= 65 ? "#3B82F6" :
                              resume.feedback.overallScore >= 55 ? "#F59E0B" :
                              resume.feedback.overallScore >= 45 ? "#F97316" :
                              resume.feedback.overallScore >= 35 ? "#EF4444" : "#DC2626"
                     }}>
                       {resume.feedback.overallScore}/100
                     </div>
                     <div className="text-sm text-gray-600 mb-3">Your ATS Score</div>
                     
                     {/* Score Badge */}
                     <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                       resume.feedback.overallScore >= 85 ? 'bg-green-100 text-green-800' :
                       resume.feedback.overallScore >= 75 ? 'bg-green-100 text-green-700' :
                       resume.feedback.overallScore >= 65 ? 'bg-blue-100 text-blue-700' :
                       resume.feedback.overallScore >= 55 ? 'bg-yellow-100 text-yellow-700' :
                       resume.feedback.overallScore >= 45 ? 'bg-orange-100 text-orange-700' :
                       resume.feedback.overallScore >= 35 ? 'bg-red-100 text-red-700' : 'bg-red-100 text-red-800'
                     }`}>
                       {resume.feedback.overallScore >= 85 ? '🏆 EXCEPTIONAL' :
                        resume.feedback.overallScore >= 75 ? '✨ EXCELLENT' :
                        resume.feedback.overallScore >= 65 ? '👍 GOOD' :
                        resume.feedback.overallScore >= 55 ? '⚠️ FAIR' :
                        resume.feedback.overallScore >= 45 ? '⚠️ POOR' :
                        resume.feedback.overallScore >= 35 ? '❌ VERY POOR' : '🚫 REJECTED'}
                     </div>
                   </div>
                 </div>
                 
                 {/* Assessment */}
                 <div className="bg-white rounded-lg p-4 shadow-sm">
                   <h4 className="font-semibold text-gray-900 mb-3">AI Assessment</h4>
                   {resume.feedback.overallAssessment ? (
                     <p className="text-gray-700 text-sm leading-relaxed">{resume.feedback.overallAssessment}</p>
                   ) : (
                     <p className="text-gray-500 text-sm italic">Assessment not available</p>
                   )}
                   
                   {/* Pass Rate */}
                   <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                     <div className="text-xs text-gray-600 mb-1">Estimated ATS Pass Rate</div>
                     <div className="text-lg font-semibold" style={{
                       color: resume.feedback.overallScore >= 75 ? "#10B981" :
                              resume.feedback.overallScore >= 55 ? "#F59E0B" : "#EF4444"
                     }}>
                       {resume.feedback.overallScore >= 85 ? '95%' :
                        resume.feedback.overallScore >= 75 ? '85%' :
                        resume.feedback.overallScore >= 65 ? '70%' :
                        resume.feedback.overallScore >= 55 ? '50%' :
                        resume.feedback.overallScore >= 45 ? '30%' :
                        resume.feedback.overallScore >= 35 ? '15%' : '5%'}
                     </div>
                   </div>
                 </div>
                 
                 {/* Score Guide */}
                 <div className="bg-white rounded-lg p-4 shadow-sm">
                   <h4 className="font-semibold text-gray-900 mb-3">Score Guide</h4>
                   <div className="space-y-2 text-xs">
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                       <span><strong>85+:</strong> Interview likely</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                       <span><strong>65-84:</strong> Good chances</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                       <span><strong>55-64:</strong> Needs work</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                       <span><strong>Below 55:</strong> Major issues</span>
                     </div>
                   </div>
                   
                   <div className="mt-4 p-2 bg-blue-50 rounded text-xs text-blue-700">
                     💡 <strong>Tip:</strong> Scores above 75 typically pass most ATS systems
                   </div>
                 </div>
               </div>
             </div>
                        {/* Resume Header */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">
                        {resume.companyName}
                      </h1>
                      <p className="text-lg text-gray-600">{resume.jobTitle}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Uploaded on {new Date(resume.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{resume.fileName}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <ScoreCircle score={resume.feedback.overallScore} />
                    <p className="text-sm text-gray-600 mt-2 font-medium">Overall Score</p>
                  </div>
                  
                  {/* Delete Button */}
                  <button
                    onClick={handleDeleteResume}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-sm"
                    title="Delete this resume"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="hidden sm:inline">Delete Resume</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ATS Compatibility */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">ATS Compatibility</h2>
                </div>
                <div className="flex items-center gap-3">
                  {resume.feedback.ATS.keywordMatch && (
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Keyword Match</div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreBgColor(resume.feedback.ATS.keywordMatch)} ${getScoreColor(resume.feedback.ATS.keywordMatch)}`}>
                        {resume.feedback.ATS.keywordMatch}%
                      </div>
                    </div>
                  )}
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(resume.feedback.ATS.score)} ${getScoreColor(resume.feedback.ATS.score)}`}>
                    {resume.feedback.ATS.score}/100
                  </div>
                </div>
              </div>
              
              {/* Missing Keywords */}
              {resume.feedback.ATS.missingKeywords && resume.feedback.ATS.missingKeywords.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Missing Critical Keywords:</h4>
                  <div className="flex flex-wrap gap-2">
                    {resume.feedback.ATS.missingKeywords.map((keyword: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                {resume.feedback.ATS.tips.map((tip: any, index: number) => (
                  <div key={index} className={`p-3 rounded-lg border ${
                    tip.type === 'good' 
                      ? 'bg-green-50 border-green-200' 
                      : tip.priority === 'high'
                      ? 'bg-red-50 border-red-200'
                      : tip.priority === 'medium'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <img 
                        src={tip.type === 'good' ? '/icons/check.svg' : '/icons/warning.svg'} 
                        alt={tip.type} 
                        className="w-4 h-4 mt-0.5 flex-shrink-0" 
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{tip.tip}</p>
                          {tip.priority && (
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              tip.priority === 'high' ? 'bg-red-100 text-red-700' :
                              tip.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {tip.priority}
                            </span>
                          )}
                        </div>
                        {tip.explanation && (
                          <p className="text-xs text-gray-600">{tip.explanation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Quality */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Content Quality</h2>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(resume.feedback.content.score)} ${getScoreColor(resume.feedback.content.score)}`}>
                  {resume.feedback.content.score}/100
                </div>
              </div>
              <div className="space-y-3">
                {resume.feedback.content.tips.map((tip: any, index: number) => (
                  <div key={index} className={`p-3 rounded-lg border ${
                    tip.type === 'good' 
                      ? 'bg-green-50 border-green-200' 
                      : tip.priority === 'high'
                      ? 'bg-red-50 border-red-200'
                      : tip.priority === 'medium'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <img 
                        src={tip.type === 'good' ? '/icons/check.svg' : '/icons/warning.svg'} 
                        alt={tip.type} 
                        className="w-4 h-4 mt-0.5 flex-shrink-0" 
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{tip.tip}</p>
                          {tip.priority && (
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              tip.priority === 'high' ? 'bg-red-100 text-red-700' :
                              tip.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {tip.priority}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">{tip.explanation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Structure */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Structure</h2>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(resume.feedback.structure.score)} ${getScoreColor(resume.feedback.structure.score)}`}>
                  {resume.feedback.structure.score}/100
                </div>
              </div>
              <div className="space-y-3">
                {resume.feedback.structure.tips.map((tip: any, index: number) => (
                  <div key={index} className={`p-3 rounded-lg ${tip.type === 'good' ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <div className="flex items-start gap-2">
                      <img 
                        src={tip.type === 'good' ? '/icons/check.svg' : '/icons/warning.svg'} 
                        alt={tip.type} 
                        className="w-4 h-4 mt-0.5 flex-shrink-0" 
                      />
                      <div>
                        <p className="text-sm font-medium">{tip.tip}</p>
                        <p className="text-xs text-gray-600 mt-1">{tip.explanation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Skills</h2>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(resume.feedback.skills.score)} ${getScoreColor(resume.feedback.skills.score)}`}>
                  {resume.feedback.skills.score}/100
                </div>
              </div>
              <div className="space-y-3">
                {resume.feedback.skills.tips.map((tip: any, index: number) => (
                  <div key={index} className={`p-3 rounded-lg ${tip.type === 'good' ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <div className="flex items-start gap-2">
                      <img 
                        src={tip.type === 'good' ? '/icons/check.svg' : '/icons/warning.svg'} 
                        alt={tip.type} 
                        className="w-4 h-4 mt-0.5 flex-shrink-0" 
                      />
                      <div>
                        <p className="text-sm font-medium">{tip.tip}</p>
                        <p className="text-xs text-gray-600 mt-1">{tip.explanation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div className="bg-white rounded-2xl p-6 mt-8 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{resume.jobDescription}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ResumeDetail;
