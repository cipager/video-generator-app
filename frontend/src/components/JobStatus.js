import React, { useState, useEffect } from 'react';
import axios from 'axios';

const JobStatus = ({ jobId, onComplete, apiBaseUrl }) => {
  const [job, setJob] = useState(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    const pollStatus = async () => {
      if (!polling) return;
      
      try {
        const response = await axios.get(`${apiBaseUrl}/api/job-status/${jobId}`);
        const jobData = response.data;
        setJob(jobData);
        
        if (jobData.status === 'completed' || jobData.status === 'failed') {
          setPolling(false);
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        setPolling(false);
      }
    };

    const interval = setInterval(pollStatus, 3000);
    pollStatus(); // Initial call

    return () => clearInterval(interval);
  }, [jobId, polling, apiBaseUrl]);

  if (!job) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Starting video generation...</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing': return 'text-yellow-600 bg-yellow-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing': return '⏳';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '📋';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Video Generation Status
      </h3>
      
      <div className="space-y-6">
        {/* Status Card */}
        <div className={`p-4 rounded-lg border-2 ${getStatusColor(job.status)} border-current`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getStatusIcon(job.status)}</span>
              <div>
                <h4 className="font-semibold">Status: {job.status.toUpperCase()}</h4>
                <p className="text-sm opacity-75">
                  {job.status === 'processing' && 'Your video is being generated...'}
                  {job.status === 'completed' && 'Your video is ready!'}
                  {job.status === 'failed' && 'Video generation failed. Please try again.'}
                </p>
              </div>
            </div>
            {job.status === 'processing' && (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
            )}
          </div>
        </div>

        {/* Progress Info */}
        {job.status === 'processing' && (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-2">This usually takes 20-30 seconds</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Result Section */}
        {job.status === 'completed' && job.output_filename && (
          <div className="text-center space-y-4">
            <div className="bg-gray-50 p-6 rounded-xl">
              <h4 className="font-semibold text-lg mb-4">🎉 Your Video is Ready!</h4>
              
              {/* Video Player */}
              <div className="mb-4">
                <video 
                  src={`${apiBaseUrl}${job.output_filename}`} 
                  controls 
                  className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                  poster="/api/placeholder/400/225"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              
              {/* Download Button */}
              <a 
                href={`${apiBaseUrl}${job.output_filename}`} 
                download
                className="inline-flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                <span>⬇️</span>
                <span>Download Video</span>
              </a>
            </div>
            
            <button 
              onClick={onComplete}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              ← Create Another Video
            </button>
          </div>
        )}

        {job.status === 'failed' && (
          <div className="text-center space-y-4">
            <div className="bg-red-50 p-6 rounded-xl">
              <h4 className="font-semibold text-lg mb-2">Something went wrong</h4>
              <p className="text-gray-600 mb-4">
                We couldn't generate your video. This might be due to high demand or temporary issues.
              </p>
              <button 
                onClick={onComplete}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobStatus;
