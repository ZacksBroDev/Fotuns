/**
 * ========================================
 * FUTONS BAND WEBSITE - SERVER
 * ========================================
 * 
 * A complete Node.js/Express server for The Futons band website
 * Features:
 * - Admin panel for content management
 * - Photo gallery with album organization
 * - Concert and music management
 * - Secure authentication with JWT
 * - File upload handling
 * - RESTful API for dynamic content
 * 
 * Author: GitHub Copilot
 * Created: August 2025
 * Version: 1.0.0
 */

// ========================================
// DEPENDENCIES & CONFIGURATION
// ========================================

const express = require('express');       // Web framework
const multer = require('multer');        // File upload handling
const path = require('path');           // File path utilities
const fs = require('fs');              // File system operations
const cors = require('cors');          // Cross-origin resource sharing
const bcrypt = require('bcryptjs');    // Password hashing
const jwt = require('jsonwebtoken');   // JSON Web Tokens for auth
const bodyParser = require('body-parser'); // Parse request bodies
require('dotenv').config();           // Load environment variables

// ========================================
// SERVER SETUP
// ========================================

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

console.log('🎸 Starting Futons Band Website Server...');

// ========================================
// MIDDLEWARE CONFIGURATION
// ========================================

/**
 * CORS (Cross-Origin Resource Sharing) Configuration
 * Allows frontend to communicate with backend securely
 */
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.ALLOWED_ORIGIN] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

/**
 * Body Parsing Middleware
 * Parses JSON and URL-encoded request bodies
 */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/**
 * Security Headers Middleware
 * Adds important security headers to all responses
 */
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');  // Prevent MIME sniffing
  res.setHeader('X-Frame-Options', 'DENY');            // Prevent iframe embedding
  res.setHeader('X-XSS-Protection', '1; mode=block');  // XSS protection
  
  // HTTPS-only security headers for production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

/**
 * Static File Serving
 * Serves HTML, CSS, JS, and image files
 */
app.use(express.static('.'));

// ========================================
// DATA STORAGE CONFIGURATION
// ========================================

/**
 * File-based data storage paths
 * Using JSON files for simple, lightweight data storage
 * Perfect for small to medium websites
 */
const DATA_DIR = './data';
const ALBUMS_FILE = path.join(DATA_DIR, 'albums.json');
const CONCERTS_FILE = path.join(DATA_DIR, 'concerts.json');
const MUSIC_FILE = path.join(DATA_DIR, 'music.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

/**
 * Create data directory if it doesn't exist
 * Ensures data storage is ready on first run
 */
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
  console.log('📁 Created data directory');
}

// ========================================
// DATA INITIALIZATION FUNCTIONS
// ========================================

/**
 * Initialize all data files with default content
 * Only runs if files don't already exist (preserves existing data)
 */
function initializeDataFiles() {
  console.log('🔧 Initializing data files...');
  
  // Initialize photo albums with sample data
  if (!fs.existsSync(ALBUMS_FILE)) {
    const initialAlbums = [
      {
        id: 'live-shows',
        title: 'Live Shows',
        description: 'Energy from our live performances',
        coverImage: '/assets/img/poser1.jpeg',
        photos: [
          '/assets/img/poser1.jpeg',
          '/assets/img/poster2.jpeg'
        ]
      },
      {
        id: 'studio-sessions',
        title: 'Studio Sessions',
        description: 'Behind the scenes recording',
        coverImage: '/assets/img/poster2.jpeg',
        photos: [
          '/assets/img/poster2.jpeg',
          '/assets/img/poser1.jpeg'
        ]
      }
    ];
    fs.writeFileSync(ALBUMS_FILE, JSON.stringify(initialAlbums, null, 2));
    console.log('✅ Albums initialized');
  }

  // Initialize concerts with sample upcoming shows
  if (!fs.existsSync(CONCERTS_FILE)) {
    const initialConcerts = [
      {
        id: 1,
        title: 'Denver Music Festival',
        date: 'June 15, 2025',
        venue: 'Downtown Denver Park',
        bookingUrl: 'https://open.spotify.com/track/3F4bilF6RN2IaSsQrNs4Vr'
      },
      {
        id: 2,
        title: 'Indie Night at The Bluebird',
        date: 'August 10, 2025',
        venue: 'The Bluebird Theater',
        bookingUrl: 'https://open.spotify.com/track/3F4bilF6RN2IaSsQrNs4Vr'
      }
    ];
    fs.writeFileSync(CONCERTS_FILE, JSON.stringify(initialConcerts, null, 2));
    console.log('✅ Concerts initialized');
  }

  // Initialize music releases with sample tracks
  if (!fs.existsSync(MUSIC_FILE)) {
    const initialMusic = [
      {
        id: 1,
        title: 'Skeuomorph',
        releaseDate: '',
        genre: 'Indie Pop',
        spotifyUrl: 'https://open.spotify.com/track/3F4bilF6RN2IaSsQrNs4Vr'
      },
      {
        id: 2,
        title: 'Wematanye',
        releaseDate: '',
        genre: 'Indie Rock',
        spotifyUrl: 'https://open.spotify.com/track/2K5s4yXx7M2GszC2XZ0mDv'
      }
    ];
    fs.writeFileSync(MUSIC_FILE, JSON.stringify(initialMusic, null, 2));
    console.log('✅ Music library initialized');
  }

  // Initialize admin user account with secure password
  if (!fs.existsSync(USERS_FILE)) {
    const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
    const initialUsers = [
      {
        id: 1,
        username: process.env.ADMIN_USERNAME || 'admin',
        password: hashedPassword,
        role: 'admin'
      }
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2));
    console.log('✅ Admin user initialized');
  }
}

// ========================================
// FILE UPLOAD CONFIGURATION
// ========================================

/**
 * Multer Storage Configuration
 * Handles photo uploads with secure file naming and validation
 */
const storage = multer.diskStorage({
  // Define upload destination
  destination: function (req, file, cb) {
    const uploadPath = './assets/img/';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  
  // Generate unique filename to prevent conflicts
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, uniqueSuffix + fileExtension);
  }
});

/**
 * Multer Upload Configuration
 * Security settings for file uploads
 */
const upload = multer({ 
  storage: storage,
  
  // Only allow image files
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  
  // Set file size limit to 100MB
  limits: {
    fileSize: 100 * 1024 * 1024  // 100MB
  }
});

// ========================================
// AUTHENTICATION MIDDLEWARE
// ========================================

/**
 * JWT Token Authentication Middleware
 * Protects admin routes by verifying JWT tokens
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function authenticateToken(req, res, next) {
  // Extract token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  // Check if token exists
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Verify token with JWT secret
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    // Add user info to request object for use in protected routes
    req.user = user;
    next();
  });
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Read data from JSON file
 * @param {string} filename - Path to JSON file
 * @returns {Array} - Parsed JSON data or empty array if error
 */
function readDataFile(filename) {
  try {
    const data = fs.readFileSync(filename, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error.message);
    return [];
  }
}

/**
 * Write data to JSON file with pretty formatting
 * @param {string} filename - Path to JSON file
 * @param {Object|Array} data - Data to write
 */
function writeDataFile(filename, data) {
  try {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filename}:`, error.message);
  }
}

// ========================================
// INITIALIZE APPLICATION
// ========================================

// Initialize data files with default content
initializeDataFiles();

// ========================================
// API ROUTES - AUTHENTICATION
// ========================================

/**
 * POST /api/auth/login
 * Authenticate admin user and return JWT token
 * 
 * Body: { username: string, password: string }
 * Returns: { token: string, user: object } or error
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    // Find user in database
    const users = readDataFile(USERS_FILE);
    const user = users.find(u => u.username === username);
    
    // Check credentials
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return success response
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      } 
    });
    
    console.log(`✅ Admin login successful: ${username}`);
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================================
// API ROUTES - ALBUMS MANAGEMENT
// ========================================

/**
 * GET /api/albums
 * Get all photo albums (public endpoint)
 * Returns: Array of album objects
 */
app.get('/api/albums', (req, res) => {
  try {
    const albums = readDataFile(ALBUMS_FILE);
    res.json(albums);
  } catch (error) {
    console.error('Error fetching albums:', error);
    res.status(500).json({ error: 'Failed to fetch albums' });
  }
});

/**
 * POST /api/albums
 * Create a new photo album (admin only)
 * 
 * Body: { title: string, description: string, coverImage: string }
 * Returns: Created album object
 */
app.post('/api/albums', authenticateToken, (req, res) => {
  try {
    const { title, description, coverImage } = req.body;
    
    // Validate input
    if (!title) {
      return res.status(400).json({ error: 'Album title is required' });
    }
    
    const albums = readDataFile(ALBUMS_FILE);
    
    // Create new album
    const newAlbum = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description?.trim() || '',
      coverImage: coverImage?.trim() || '',
      photos: []
    };
    
    albums.push(newAlbum);
    writeDataFile(ALBUMS_FILE, albums);
    
    console.log(`✅ Album created: ${newAlbum.title}`);
    res.json(newAlbum);
    
  } catch (error) {
    console.error('Error creating album:', error);
    res.status(500).json({ error: 'Failed to create album' });
  }
});

/**
 * PUT /api/albums/:id
 * Update an existing album (admin only)
 * 
 * Params: id - Album ID
 * Body: { title?, description?, coverImage? }
 * Returns: Updated album object
 */
app.put('/api/albums/:id', authenticateToken, (req, res) => {
  try {
    const albums = readDataFile(ALBUMS_FILE);
    const albumIndex = albums.findIndex(a => a.id === req.params.id);
    
    if (albumIndex === -1) {
      return res.status(404).json({ error: 'Album not found' });
    }
    
    // Update album with provided fields
    albums[albumIndex] = { 
      ...albums[albumIndex], 
      ...req.body,
      id: req.params.id  // Ensure ID doesn't change
    };
    
    writeDataFile(ALBUMS_FILE, albums);
    
    console.log(`✅ Album updated: ${albums[albumIndex].title}`);
    res.json(albums[albumIndex]);
    
  } catch (error) {
    console.error('Error updating album:', error);
    res.status(500).json({ error: 'Failed to update album' });
  }
});

/**
 * DELETE /api/albums/:id
 * Delete an album (admin only)
 * 
 * Params: id - Album ID
 * Returns: Success message
 */
app.delete('/api/albums/:id', authenticateToken, (req, res) => {
  try {
    const albums = readDataFile(ALBUMS_FILE);
    const initialLength = albums.length;
    const filteredAlbums = albums.filter(a => a.id !== req.params.id);
    
    if (filteredAlbums.length === initialLength) {
      return res.status(404).json({ error: 'Album not found' });
    }
    
    writeDataFile(ALBUMS_FILE, filteredAlbums);
    
    console.log(`✅ Album deleted: ${req.params.id}`);
    res.json({ message: 'Album deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting album:', error);
    res.status(500).json({ error: 'Failed to delete album' });
  }
});

// Concerts routes
app.get('/api/concerts', (req, res) => {
  const concerts = readDataFile(CONCERTS_FILE);
  res.json(concerts);
});

app.post('/api/concerts', authenticateToken, (req, res) => {
  const concerts = readDataFile(CONCERTS_FILE);
  const newConcert = {
    id: Date.now(),
    title: req.body.title,
    date: req.body.date,
    venue: req.body.venue,
    bookingUrl: req.body.bookingUrl || ''
  };
  concerts.push(newConcert);
  writeDataFile(CONCERTS_FILE, concerts);
  res.json(newConcert);
});

app.put('/api/concerts/:id', authenticateToken, (req, res) => {
  const concerts = readDataFile(CONCERTS_FILE);
  const concertIndex = concerts.findIndex(c => c.id === parseInt(req.params.id));
  
  if (concertIndex === -1) {
    return res.status(404).json({ error: 'Concert not found' });
  }
  
  concerts[concertIndex] = { ...concerts[concertIndex], ...req.body };
  writeDataFile(CONCERTS_FILE, concerts);
  res.json(concerts[concertIndex]);
});

app.delete('/api/concerts/:id', authenticateToken, (req, res) => {
  const concerts = readDataFile(CONCERTS_FILE);
  const filteredConcerts = concerts.filter(c => c.id !== parseInt(req.params.id));
  writeDataFile(CONCERTS_FILE, filteredConcerts);
  res.json({ message: 'Concert deleted successfully' });
});

// Music routes
app.get('/api/music', (req, res) => {
  const music = readDataFile(MUSIC_FILE);
  res.json(music);
});

app.post('/api/music', authenticateToken, (req, res) => {
  const music = readDataFile(MUSIC_FILE);
  const newTrack = {
    id: Date.now(),
    title: req.body.title,
    releaseDate: req.body.releaseDate,
    genre: req.body.genre,
    spotifyUrl: req.body.spotifyUrl || ''
  };
  music.push(newTrack);
  writeDataFile(MUSIC_FILE, music);
  res.json(newTrack);
});

app.put('/api/music/:id', authenticateToken, (req, res) => {
  const music = readDataFile(MUSIC_FILE);
  const trackIndex = music.findIndex(m => m.id === parseInt(req.params.id));
  
  if (trackIndex === -1) {
    return res.status(404).json({ error: 'Track not found' });
  }
  
  music[trackIndex] = { ...music[trackIndex], ...req.body };
  writeDataFile(MUSIC_FILE, music);
  res.json(music[trackIndex]);
});

app.delete('/api/music/:id', authenticateToken, (req, res) => {
  const music = readDataFile(MUSIC_FILE);
  const filteredMusic = music.filter(m => m.id !== parseInt(req.params.id));
  writeDataFile(MUSIC_FILE, filteredMusic);
  res.json({ message: 'Track deleted successfully' });
});

// Photo upload route
app.post('/api/upload', authenticateToken, upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const imagePath = `/assets/img/${req.file.filename}`;
  res.json({ imagePath });
});

// Add photo to album
app.post('/api/albums/:id/photos', authenticateToken, (req, res) => {
  const albums = readDataFile(ALBUMS_FILE);
  const albumIndex = albums.findIndex(a => a.id === req.params.id);
  
  if (albumIndex === -1) {
    return res.status(404).json({ error: 'Album not found' });
  }
  
  albums[albumIndex].photos.push(req.body.photoPath);
  writeDataFile(ALBUMS_FILE, albums);
  res.json(albums[albumIndex]);
});

// Remove photo from album
app.delete('/api/albums/:id/photos', authenticateToken, (req, res) => {
  const albums = readDataFile(ALBUMS_FILE);
  const albumIndex = albums.findIndex(a => a.id === req.params.id);
  
  if (albumIndex === -1) {
    return res.status(404).json({ error: 'Album not found' });
  }
  
  albums[albumIndex].photos = albums[albumIndex].photos.filter(
    photo => photo !== req.body.photoPath
  );
  writeDataFile(ALBUMS_FILE, albums);
  res.json(albums[albumIndex]);
});

// Serve admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Default route serves main site
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🎸 Futons server running on http://localhost:${PORT}`);
  console.log(`🔧 Admin panel available at http://localhost:${PORT}/admin`);
});
