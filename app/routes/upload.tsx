import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '~/contexts/AuthContext';
import { useToast } from '~/contexts/ToastContext';
import Navbar from '~/components/Navbar';
import LoadingSpinner from '~/components/LoadingSpinner';
import { validateDocumentFile, extractTextFromDocument } from '~/lib/pdf';

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: string | null;
}

const Upload = () => {
    const { isAuthenticated, token } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadState, setUploadState] = useState<UploadState>({
        isUploading: false,
        progress: 0,
        error: null,
        success: null,
    });
    const [formData, setFormData] = useState({
        company: '',
        jobTitle: '',
        jobDescription: '',
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Redirect if not authenticated
    React.useEffect(() => {
        if (!isAuthenticated) {
            navigate('/auth');
        }
    }, [isAuthenticated, navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const validation = validateDocumentFile(file);
            if (!validation.isValid) {
                setUploadState(prev => ({ ...prev, error: validation.error || 'Invalid file' }));
                setSelectedFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }
            setSelectedFile(file);
            setUploadState(prev => ({ ...prev, error: null }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedFile) {
            setUploadState(prev => ({ ...prev, error: 'Please select a PDF or DOCX file' }));
            return;
        }

        if (!formData.company || !formData.jobTitle || !formData.jobDescription) {
            setUploadState(prev => ({ ...prev, error: 'Please fill in all fields' }));
            return;
        }

        setUploadState({
            isUploading: true,
            progress: 0,
            error: null,
            success: null,
        });

        try {
            // Update progress for document processing
            setUploadState(prev => ({ ...prev, progress: 20 }));

            // Extract text from document on client side
            let resumeText: string;
            try {
                console.log('Starting document text extraction...');
                console.log('File type:', selectedFile.type);
                console.log('File size:', selectedFile.size, 'bytes');
                console.log('File name:', selectedFile.name);
                
                resumeText = await extractTextFromDocument(selectedFile);
                console.log(`Successfully extracted ${resumeText.length} characters of text`);
                console.log('First 200 characters:', resumeText.substring(0, 200));
                console.log('Last 200 characters:', resumeText.substring(Math.max(0, resumeText.length - 200)));
                
                if (resumeText.length < 100) {
                    throw new Error('Extracted text is too short. The document might be image-based or corrupted.');
                }
                
                // Check for common issues
                if (resumeText.includes('') || resumeText.includes('')) {
                    console.warn('Warning: Text contains replacement characters, which may indicate encoding issues');
                }
                
                // Validate text content
                const words = resumeText.split(/\s+/);
                const validWords = words.filter(word => word.length > 0 && /[a-zA-Z]/.test(word));
                console.log(`Extracted ${validWords.length} valid words out of ${words.length} total words`);
                
                if (validWords.length < 10) {
                    throw new Error('Extracted text contains too few valid words. The document might be corrupted or image-based.');
                }
                
                // Clean up the text before sending to AI
                resumeText = resumeText
                    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                    .replace(/\n\s*\n/g, '\n') // Remove empty lines
                    .trim();
                
                console.log('Cleaned text length:', resumeText.length);
                console.log('Cleaned text sample:', resumeText.substring(0, 300) + '...');
                
                // Final validation
                if (resumeText.length < 100) {
                    throw new Error('After cleaning, the extracted text is too short. Please try a different document.');
                }
                
            } catch (docError) {
                console.error('Document processing failed:', docError);
                setUploadState(prev => ({ 
                    ...prev, 
                    error: docError instanceof Error ? docError.message : 'Failed to process document file',
                    isUploading: false,
                    progress: 0
                }));
                return;
            }
            
            if (!resumeText || resumeText.trim().length === 0) {
                setUploadState(prev => ({ 
                    ...prev, 
                    error: 'No text could be extracted from the document. Please ensure the file contains readable text.',
                    isUploading: false,
                    progress: 0
                }));
                return;
            }
            
            setUploadState(prev => ({ ...prev, progress: 50 }));

            const data = new FormData();
            data.append('company', formData.company);
            data.append('jobTitle', formData.jobTitle);
            data.append('jobDescription', formData.jobDescription);
            data.append('resumeText', resumeText);
            data.append('fileName', selectedFile.name);
            data.append('fileSize', selectedFile.size.toString());
            data.append('resume', selectedFile);

            // Simulate progress updates for AI analysis
            const progressInterval = setInterval(() => {
                setUploadState(prev => ({
                    ...prev,
                    progress: Math.min(prev.progress + 10, 90)
                }));
            }, 500);

            const response = await fetch('/api/resume/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: data,
            });

            clearInterval(progressInterval);

            const result = await response.json();

                    if (response.ok) {
            setUploadState(prev => ({
                ...prev,
                isUploading: false,
                progress: 100,
                success: 'Resume uploaded and analyzed successfully!',
            }));

            showToast('success', 'Resume uploaded and analyzed successfully!');

            // Reset form
            setFormData({ company: '', jobTitle: '', jobDescription: '' });
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            // Redirect to home page after 2 seconds
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } else {
            const errorMessage = result.error || 'Upload failed';
            setUploadState(prev => ({
                ...prev,
                isUploading: false,
                progress: 0,
                error: errorMessage,
            }));
            showToast('error', errorMessage);
        }
        } catch (error) {
            const errorMessage = 'Network error. Please try again.';
            setUploadState(prev => ({
                ...prev,
                isUploading: false,
                progress: 0,
                error: errorMessage,
            }));
            showToast('error', errorMessage);
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />
            <div className="main-section">
                <div className="page-heading">
                    <h1>Upload Your Resume</h1>
                    <h2>Get AI-powered feedback for your job application</h2>
                </div>
                
                <div className="w-full max-w-lg sm:max-w-xl md:max-w-2xl">
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                        <div className="form-div">
                            <label htmlFor="company" className="text-sm font-medium">
                                Company Name
                            </label>
                            <input
                                type="text"
                                id="company"
                                name="company"
                                value={formData.company}
                                onChange={handleInputChange}
                                placeholder="Enter company name"
                                required
                                disabled={uploadState.isUploading}
                            />
                        </div>

                        <div className="form-div">
                            <label htmlFor="jobTitle" className="text-sm font-medium">
                                Job Title
                            </label>
                            <input
                                type="text"
                                id="jobTitle"
                                name="jobTitle"
                                value={formData.jobTitle}
                                onChange={handleInputChange}
                                placeholder="Enter job title"
                                required
                                disabled={uploadState.isUploading}
                            />
                        </div>

                        <div className="form-div">
                            <label htmlFor="jobDescription" className="text-sm font-medium">
                                Job Description
                            </label>
                            <textarea
                                id="jobDescription"
                                name="jobDescription"
                                value={formData.jobDescription}
                                onChange={handleInputChange}
                                placeholder="Paste the job description here"
                                rows={4}
                                className="resize-none"
                                required
                                disabled={uploadState.isUploading}
                            />
                        </div>

                        <div className="form-div">
                            <label htmlFor="resume" className="text-sm font-medium">
                                Upload Resume (PDF or DOCX)
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                id="resume"
                                name="resume"
                                accept=".pdf,.docx"
                                onChange={handleFileChange}
                                required
                                disabled={uploadState.isUploading}
                                className="p-2 sm:p-3 border border-gray-300 rounded-lg text-sm sm:text-base"
                            />
                            {selectedFile && (
                                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-700">
                                        Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Progress Bar */}

                    {uploadState.isUploading && (
                    <div className="fixed top-0 left-0 w-screen h-screen z-50 flex flex-col items-center justify-center bg-black/30 backdrop-blur-xl">
                            {/* Scanning Card */}
                        <div className="relative w-80 h-[28rem] sm:w-[28rem] sm:h-[36rem] lg:w-[32rem] lg:h-[42rem] bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gray-200 mb-6 animate-[zoomIn_0.3s_ease-out] select-none cursor-default">
                            <img
                                src = "/images/resume-scan.gif"
                                alt="Resume scanning"
                                className="w-full h-full object-cover select-none pointer-events-none"
                            />    

                            {/* Progress % overlay */}
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                                {uploadState.progress}%
                            </div>
                        </div>

                        {/* Status text directly under card, centered */}
                        <div className="text-center text-white text-sm sm:text-base">
                            {uploadState.progress < 30
                                ? "Extracting document text..."
                                : uploadState.progress < 70
                                ? "AI analyzing resume..."
                                : uploadState.progress < 90
                                ? "Processing results..."
                                : "Finalizing..."}
                            <p className="text-xs text-gray-200 mt-1">
                                Real-time AI analysis powered by Gemini
                            </p>
                        </div>
                    </div>
                    )}

                        {/* Error Message */}
                        {uploadState.error && (
                            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                                {uploadState.error}
                            </div>
                        )}

                        {/* Success Message */}
                        {uploadState.success && (
                            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                                {uploadState.success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={uploadState.isUploading}
                            className="auth-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploadState.isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {uploadState.progress < 30 ? 'Extracting Text...' :
                         uploadState.progress < 70 ? 'AI Analyzing...' :
                         uploadState.progress < 90 ? 'Processing Results...' : 'Finalizing...'}
                      </>
                    ) : (
                      'Analyze Resume'
                    )}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
};

export default Upload;