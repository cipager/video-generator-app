import React, { useState, useEffect } from 'react';
import VideoGenerator from './components/VideoGenerator';
import JobStatus from './components/JobStatus';
import './App.css';

// Use environment variable for API URL or default to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [currentJob, setCurrentJob] = useState(null);
  const [availableParams, setAvailableParams] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAvailableParams();
  }, []);

  const fetchAvailableParams = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/parameters`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const params = await response.json();
      setAvailableParams(params);
      setError('');
    } catch (error) {
      console.error('Failed to fetch parameters:', error);
      setError('Failed to connect to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            🎬 Free Video Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create unique video clips by mixing pre-recorded footage based on your preferences
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Connection Error: </strong>
            {error}
            <button 
              onClick={fetchAvailableParams}
              className="ml-4 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading available options...</p>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && (
          <>
            <VideoGenerator 
              availableParams={availableParams}
              onJobCreated={setCurrentJob}
              apiBaseUrl={API_BASE_URL}
            />
            
            {currentJob && (
              <JobStatus 
                jobId={currentJob.jobId}
                onComplete={() => setCurrentJob(null)}
                apiBaseUrl={API_BASE_URL}
              />
            )}
          </>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500">
          <p>Built with ❤️ | Free forever | No credit card required</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
