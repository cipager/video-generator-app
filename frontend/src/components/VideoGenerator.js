import React, { useState } from 'react';
import axios from 'axios';

const VideoGenerator = ({ availableParams, onJobCreated, apiBaseUrl }) => {
  const [formData, setFormData] = useState({
    location: '',
    timeOfDay: '',
    season: '',
    duration: 15,
    style: 'cinematic'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${apiBaseUrl}/api/generate-video`, formData);
      onJobCreated(response.data);
    } catch (error) {
      console.error('Error generating video:', error);
      setError(error.response?.data?.error || 'Failed to generate video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // Clear error when user makes changes
  };

  const demoOptions = {
    locations: ['Prague', 'Paris', 'New York', 'Tokyo', 'London'],
    times: ['day', 'night', 'sunrise', 'sunset'],
    seasons: ['spring', 'summer', 'autumn', 'winter']
  };

  const actualLocations = availableParams.locations || demoOptions.locations;
  const actualTimes = availableParams.times || demoOptions.times;
  const actualSeasons = availableParams.seasons || demoOptions.seasons;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Create Your Video</h2>
        <p className="text-gray-600">Choose your preferences and generate a unique video in seconds</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              📍 Location
            </label>
            <select 
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              required
            >
              <option value="">Select a location</option>
              {actualLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          
          {/* Time of Day */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              ⏰ Time of Day
            </label>
            <select 
              value={formData.timeOfDay}
              onChange={(e) => handleChange('timeOfDay', e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              required
            >
              <option value="">Select time</option>
              {actualTimes.map(time => (
                <option key={time} value={time}>{time.charAt(0).toUpperCase() + time.slice(1)}</option>
              ))}
            </select>
          </div>
          
          {/* Season */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              🌸 Season
            </label>
            <select 
              value={formData.season}
              onChange={(e) => handleChange('season', e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              required
            >
              <option value="">Select season</option>
              {actualSeasons.map(season => (
                <option key={season} value={season}>{season.charAt(0).toUpperCase() + season.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              ⏱️ Duration (seconds)
            </label>
            <div className="flex items-center space-x-4">
              <input 
                type="range" 
                min="5" 
                max="30"
                step="5"
                value={formData.duration}
                onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-lg font-semibold text-gray-700 min-w-12">
                {formData.duration}s
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5s</span>
              <span>15s</span>
              <span>30s</span>
            </div>
          </div>
          
          {/* Style */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              🎨 Style
            </label>
            <select 
              value={formData.style}
              onChange={(e) => handleChange('style', e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            >
              <option value="cinematic">🎬 Cinematic</option>
              <option value="dynamic">⚡ Dynamic</option>
              <option value="smooth">🌊 Smooth</option>
            </select>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Generating Your Video...
              </div>
            ) : (
              '🎥 Generate Video Now'
            )}
          </button>
          <p className="text-center text-gray-500 text-sm mt-3">
            Free • No registration required • Process takes 20-30 seconds
          </p>
        </div>
      </form>
    </div>
  );
};

export default VideoGenerator;
