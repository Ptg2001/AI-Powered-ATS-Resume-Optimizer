import { Link } from "react-router";
import ScoreCircle from "~/components/ScoreCircle";
import { useState } from "react";

interface ResumeCardProps {
  resume: {
    id: string;
    companyName: string;
    jobTitle: string;
    fileName: string;
    feedback: any;
    createdAt: string;
    updatedAt: string;
  };
  onDelete?: (id: string) => void;
}

const ResumeCard = ({ resume, onDelete }: ResumeCardProps) => {
  const { id, companyName, jobTitle, feedback, fileName, createdAt } = resume;
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!onDelete) return;
    
    if (confirm(`Are you sure you want to delete this resume for ${companyName} - ${jobTitle}?`)) {
      setIsDeleting(true);
      try {
        await onDelete(id);
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete resume. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85) return { text: 'EXCEPTIONAL', color: 'bg-green-100 text-green-800' };
    if (score >= 75) return { text: 'EXCELLENT', color: 'bg-green-100 text-green-700' };
    if (score >= 65) return { text: 'GOOD', color: 'bg-blue-100 text-blue-700' };
    if (score >= 55) return { text: 'FAIR', color: 'bg-yellow-100 text-yellow-700' };
    if (score >= 45) return { text: 'POOR', color: 'bg-orange-100 text-orange-700' };
    if (score >= 35) return { text: 'VERY POOR', color: 'bg-red-100 text-red-700' };
    return { text: 'REJECTED', color: 'bg-red-100 text-red-800' };
  };

  const scoreBadge = getScoreBadge(feedback.overallScore);
  
  return (
    <div className="group relative">
      {/* Delete Button */}
      {onDelete && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute top-4 right-4 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
          title="Delete resume"
        >
          {isDeleting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      )}
      
      <Link to={`/resume/${id}`} className="block">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-gray-900 truncate">
                    {companyName}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    {jobTitle}
                  </p>
                </div>
              </div>
              
              {/* File Info */}
              <div className="flex items-center gap-4 text-xs text-gray-500 ml-13">
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{new Date(createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="truncate max-w-32">{fileName}</span>
                </div>
              </div>
            </div>
            
            {/* Score Section */}
            <div className="flex flex-col items-center gap-3 ml-4">
              <ScoreCircle score={feedback.overallScore} />
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${scoreBadge.color}`}>
                {scoreBadge.text}
              </div>
            </div>
          </div>
          
          {/* Score Details */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">ATS</div>
              <div className={`text-lg font-bold ${getScoreColor(feedback.ATS?.score || 0)}`}>
                {feedback.ATS?.score || 0}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Content</div>
              <div className={`text-lg font-bold ${getScoreColor(feedback.content?.score || 0)}`}>
                {feedback.content?.score || 0}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Structure</div>
              <div className={`text-lg font-bold ${getScoreColor(feedback.structure?.score || 0)}`}>
                {feedback.structure?.score || 0}
              </div>
            </div>
          </div>
          
          {/* Action Hint */}
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-700 font-medium">
              Click to view detailed analysis and feedback
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ResumeCard;