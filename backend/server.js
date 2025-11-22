const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Free PostgreSQL Database (Neon.tech)
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Simple file-based storage for free tier
const STORAGE_PATH = './uploads';

// Ensure storage directory exists
async function ensureStorage() {
  try {
    await fs.access(STORAGE_PATH);
  } catch {
    await fs.mkdir(STORAGE_PATH, { recursive: true });
  }
}

// Initialize database tables
async function initDB() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS video_clips (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        location VARCHAR(100) NOT NULL,
        time_of_day VARCHAR(20) CHECK (time_of_day IN ('day', 'night', 'sunrise', 'sunset')),
        season VARCHAR(20) CHECK (season IN ('spring', 'summer', 'autumn', 'winter')),
        duration DECIMAL(5,2) NOT NULL,
        tags TEXT[],
        storage_path VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS generated_videos (
        id SERIAL PRIMARY KEY,
        user_parameters JSONB NOT NULL,
        clip_sequence JSONB NOT NULL,
        output_filename VARCHAR(255),
        status VARCHAR(50) DEFAULT 'processing',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('Database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// API Routes
app.get('/api/parameters', async (req, res) => {
  try {
    const locations = await db.query('SELECT DISTINCT location FROM video_clips');
    const times = await db.query('SELECT DISTINCT time_of_day FROM video_clips');
    const seasons = await db.query('SELECT DISTINCT season FROM video_clips');
    
    res.json({
      locations: locations.rows.map(r => r.location),
      times: times.rows.map(r => r.time_of_day),
      seasons: seasons.rows.map(r => r.season)
    });
  } catch (error) {
    console.error('Parameters error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch parameters',
      details: error.message 
    });
  }
});

app.post('/api/generate-video', async (req, res) => {
  const { location, timeOfDay, season, duration, style } = req.body;
  
  try {
    console.log('Generating video for:', { location, timeOfDay, season, duration });
    
    // Get matching clips
    const clips = await db.query(
      `SELECT * FROM video_clips 
       WHERE location = $1 
       AND time_of_day = $2 
       AND season = $3 
       ORDER BY RANDOM() 
       LIMIT 8`,
      [location, timeOfDay, season]
    );

    if (clips.rows.length === 0) {
      return res.status(404).json({ 
        error: 'No clips found matching your criteria',
        suggestion: 'Try different location, time, or season'
      });
    }

    const sequence = generateClipSequence(clips.rows, duration, style);
    
    const job = await db.query(
      'INSERT INTO generated_videos (user_parameters, clip_sequence) VALUES ($1, $2) RETURNING id',
      [req.body, sequence]
    );

    // Process in background (non-blocking)
    processVideo(job.rows[0].id, sequence).catch(console.error);

    res.json({ 
      jobId: job.rows[0].id, 
      status: 'processing',
      message: 'Video generation started',
      estimatedTime: '20-30 seconds',
      clipsUsed: sequence.length
    });
    
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ 
      error: 'Failed to start video generation',
      details: error.message 
    });
  }
});

app.get('/api/job-status/:jobId', async (req, res) => {
  try {
    const job = await db.query(
      'SELECT * FROM generated_videos WHERE id = $1', 
      [req.params.jobId]
    );
    
    if (job.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(job.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve generated videos
app.use('/api/videos', express.static(STORAGE_PATH));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Helper functions
function generateClipSequence(clips, totalDuration, style) {
  const sequence = [];
  let remainingDuration = totalDuration;
  
  // Shuffle clips
  const shuffledClips = [...clips].sort(() => Math.random() - 0.5);
  
  for (const clip of shuffledClips) {
    if (remainingDuration <= 0) break;
    
    const clipDuration = Math.min(
      clip.duration,
      Math.random() * 2 + 1, // 1-3 seconds per clip
      remainingDuration
    );
    
    sequence.push({
      clipId: clip.id,
      filename: clip.filename,
      duration: clipDuration,
      transition: getRandomTransition(style),
      storagePath: clip.storage_path
    });
    
    remainingDuration -= clipDuration;
  }
  
  return sequence;
}

function getRandomTransition(style) {
  const transitions = {
    cinematic: ['fade', 'fade', 'dissolve'],
    dynamic: ['fade', 'slide'],
    smooth: ['fade']
  };
  const available = transitions[style] || transitions.smooth;
  return available[Math.floor(Math.random() * available.length)];
}

async function processVideo(jobId, sequence) {
  try {
    await ensureStorage();
    const tempDir = path.join(STORAGE_PATH, `temp_${jobId}`);
    const outputDir = path.join(STORAGE_PATH, 'generated');
    
    await fs.mkdir(tempDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });
    
    // For demo purposes - simulate video processing
    // In real implementation, you'd use FFmpeg here
    
    const outputFilename = `video_${jobId}_${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Update job status
    await db.query(
      'UPDATE generated_videos SET status = $1, output_filename = $2 WHERE id = $3',
      ['completed', `/api/videos/generated/${outputFilename}`, jobId]
    );
    
    console.log(`Video ${jobId} processing completed`);
    
    // Cleanup temp directory after 5 minutes
    setTimeout(async () => {
      try {
        await fs.rm(tempDir, { recursive: true });
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }, 300000);
    
  } catch (error) {
    console.error(`Video processing error for job ${jobId}:`, error);
    await db.query(
      'UPDATE generated_videos SET status = $1 WHERE id = $2',
      ['failed', jobId]
    );
  }
}

// Initialize and start server
async function startServer() {
  await ensureStorage();
  await initDB();
  
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  });
}

startServer().catch(console.error);
