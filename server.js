const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CONCERTS_FILE = path.join(DATA_DIR, 'concerts.json');
const SONGS_FILE = path.join(DATA_DIR, 'songs.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'futons_secret_key_2025';

// Email configuration (optional)
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

// Utility functions
const readJSONFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
};

const writeJSONFile = async (filePath, data) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    throw error;
  }
};

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Admin middleware
const requireAdmin = async (req, res, next) => {
  try {
    const users = await readJSONFile(USERS_FILE);
    const user = users.find(u => u.id === req.user.userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'The Futons API is running' });
});

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, newsletter = false } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const users = await readJSONFile(USERS_FILE);
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: generateId(),
      name,
      email,
      password: hashedPassword,
      role: 'user',
      newsletter,
      joinDate: new Date().toISOString().split('T')[0]
    };

    users.push(newUser);
    await writeJSONFile(USERS_FILE, users);

    res.json({
      success: true,
      message: 'User registered successfully',
      userId: newUser.id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = await readJSONFile(USERS_FILE);
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        newsletter: user.newsletter
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token
app.get('/api/verify-token', authenticateToken, async (req, res) => {
  try {
    const users = await readJSONFile(USERS_FILE);
    const user = users.find(u => u.id === req.user.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        newsletter: user.newsletter
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update newsletter preference
app.post('/api/newsletter-preference', authenticateToken, async (req, res) => {
  try {
    const { subscribed } = req.body;
    const users = await readJSONFile(USERS_FILE);
    
    const userIndex = users.findIndex(u => u.id === req.user.userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    users[userIndex].newsletter = subscribed;
    await writeJSONFile(USERS_FILE, users);

    res.json({
      success: true,
      message: 'Newsletter preference updated'
    });
  } catch (error) {
    console.error('Newsletter preference error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get concerts
app.get('/api/concerts', async (req, res) => {
  try {
    const concerts = await readJSONFile(CONCERTS_FILE);
    res.json({
      success: true,
      concerts: concerts.sort((a, b) => new Date(a.date) - new Date(b.date))
    });
  } catch (error) {
    console.error('Get concerts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add concert (admin only)
app.post('/api/concerts', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, date, venue, description, ticketUrl = '' } = req.body;

    if (!title || !date || !venue) {
      return res.status(400).json({ error: 'Title, date, and venue are required' });
    }

    const concerts = await readJSONFile(CONCERTS_FILE);
    const newConcert = {
      id: generateId(),
      title,
      date,
      venue,
      description,
      ticketUrl,
      createdAt: new Date().toISOString().split('T')[0]
    };

    concerts.push(newConcert);
    await writeJSONFile(CONCERTS_FILE, concerts);

    // Send newsletter emails
    if (transporter) {
      await sendNewsletterEmails('new-concert', newConcert);
    }

    res.json({
      success: true,
      message: 'Concert added successfully',
      concert: newConcert
    });
  } catch (error) {
    console.error('Add concert error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get songs
app.get('/api/songs', async (req, res) => {
  try {
    const songs = await readJSONFile(SONGS_FILE);
    res.json({
      success: true,
      songs: songs.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
    });
  } catch (error) {
    console.error('Get songs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add song (admin only)
app.post('/api/songs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, genre, releaseDate, spotifyUrl, description } = req.body;

    if (!title || !genre) {
      return res.status(400).json({ error: 'Title and genre are required' });
    }

    const songs = await readJSONFile(SONGS_FILE);
    const newSong = {
      id: generateId(),
      title,
      genre,
      releaseDate: releaseDate || new Date().toISOString().split('T')[0],
      spotifyUrl: spotifyUrl || '',
      description: description || ''
    };

    songs.push(newSong);
    await writeJSONFile(SONGS_FILE, songs);

    res.json({
      success: true,
      message: 'Song added successfully',
      song: newSong
    });
  } catch (error) {
    console.error('Add song error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Contact form
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const contacts = await readJSONFile(CONTACTS_FILE);
    const newContact = {
      id: generateId(),
      name,
      email,
      message,
      createdAt: new Date().toISOString()
    };

    contacts.push(newContact);
    await writeJSONFile(CONTACTS_FILE, contacts);

    res.json({
      success: true,
      message: 'Contact form submitted successfully'
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send newsletter emails
const sendNewsletterEmails = async (type, data) => {
  try {
    if (!transporter) {
      console.log('Email not configured - skipping newsletter');
      return;
    }

    const users = await readJSONFile(USERS_FILE);
    const subscribers = users.filter(u => u.newsletter);

    if (subscribers.length === 0) {
      console.log('No newsletter subscribers');
      return;
    }

    let subject, html;
    
    if (type === 'new-concert') {
      subject = `🎸 New Concert: ${data.title}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6c5ce7;">🎸 The Futons - New Concert!</h2>
          <h3>${data.title}</h3>
          <p><strong>Date:</strong> ${new Date(data.date).toLocaleDateString()}</p>
          <p><strong>Venue:</strong> ${data.venue}</p>
          ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
          ${data.ticketUrl ? `<p><a href="${data.ticketUrl}" style="background: #6c5ce7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Get Tickets</a></p>` : ''}
          <p>See you there!</p>
          <p style="color: #666;">
            Best regards,<br>
            The Futons Band
          </p>
        </div>
      `;
    }

    // Send emails to all subscribers
    const emailPromises = subscribers.map(subscriber => {
      return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: subscriber.email,
        subject: subject,
        html: html
      });
    });

    await Promise.all(emailPromises);
    console.log(`Newsletter sent to ${subscribers.length} subscribers`);
  } catch (error) {
    console.error('Newsletter send error:', error);
  }
};

// Manual newsletter endpoint (admin only)
app.post('/api/send-newsletter', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { subject, message, type = 'general' } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    const users = await readJSONFile(USERS_FILE);
    const subscribers = users.filter(u => u.newsletter);

    if (subscribers.length === 0) {
      return res.json({
        success: true,
        message: 'No newsletter subscribers found'
      });
    }

    if (!transporter) {
      return res.json({
        success: true,
        message: `Newsletter would be sent to ${subscribers.length} subscribers (email not configured)`
      });
    }

    // Create email content
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #6c5ce7; font-size: 28px;">🎸 The Futons</h1>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-bottom: 15px;">${subject}</h2>
          <div style="color: #555; line-height: 1.6;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #666; font-size: 14px;">
            You're receiving this because you subscribed to The Futons newsletter.<br>
            Thanks for supporting indie music! 🎵
          </p>
        </div>
      </div>
    `;

    // Send emails to all subscribers
    const emailPromises = subscribers.map(subscriber => {
      return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: subscriber.email,
        subject: `🎸 The Futons: ${subject}`,
        html: html
      });
    });

    await Promise.all(emailPromises);

    res.json({
      success: true,
      message: `Newsletter sent to ${subscribers.length} subscribers`,
      subscriberCount: subscribers.length
    });
  } catch (error) {
    console.error('Manual newsletter error:', error);
    res.status(500).json({ error: 'Failed to send newsletter' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🎸 The Futons API server is running on port ${PORT}`);
  console.log(`📁 Data directory: ${DATA_DIR}`);
});
