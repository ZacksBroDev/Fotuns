const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'futons_user',
  password: process.env.DB_PASSWORD || 'futons_secure_password_2024',
  database: process.env.DB_NAME || 'futons_band',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'The Futons API is running' });
});

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    res.json({
      success: true,
      message: 'User registered successfully',
      userId: result.insertId
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

    // Find user
    const [users] = await db.execute(
      'SELECT id, name, email, password, newsletter_subscribed FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        newsletter_subscribed: user.newsletter_subscribed
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
    const [users] = await db.execute(
      'SELECT id, name, email, newsletter_subscribed FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: users[0]
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

    await db.execute(
      'UPDATE users SET newsletter_subscribed = ? WHERE id = ?',
      [subscribed, req.user.userId]
    );

    res.json({
      success: true,
      message: 'Newsletter preference updated'
    });
  } catch (error) {
    console.error('Newsletter preference error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add concert (admin only)
app.post('/api/concerts', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const [users] = await db.execute(
      'SELECT email FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0 || users[0].email !== 'admin@futons.com') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { title, date, venue, description } = req.body;

    if (!title || !date || !venue) {
      return res.status(400).json({ error: 'Title, date, and venue are required' });
    }

    const [result] = await db.execute(
      'INSERT INTO concerts (title, date, venue, description) VALUES (?, ?, ?, ?)',
      [title, date, venue, description]
    );

    res.json({
      success: true,
      message: 'Concert added successfully',
      concertId: result.insertId
    });
  } catch (error) {
    console.error('Add concert error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add song (admin only)
app.post('/api/songs', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const [users] = await db.execute(
      'SELECT email FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0 || users[0].email !== 'admin@futons.com') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { title, genre, releaseDate, spotifyUrl } = req.body;

    if (!title || !genre) {
      return res.status(400).json({ error: 'Title and genre are required' });
    }

    const [result] = await db.execute(
      'INSERT INTO songs (title, genre, release_date, spotify_url) VALUES (?, ?, ?, ?)',
      [title, genre, releaseDate, spotifyUrl]
    );

    res.json({
      success: true,
      message: 'Song added successfully',
      songId: result.insertId
    });
  } catch (error) {
    console.error('Add song error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get concerts
app.get('/api/concerts', async (req, res) => {
  try {
    const [concerts] = await db.execute(
      'SELECT * FROM concerts ORDER BY date DESC'
    );

    res.json({
      success: true,
      concerts
    });
  } catch (error) {
    console.error('Get concerts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get songs
app.get('/api/songs', async (req, res) => {
  try {
    const [songs] = await db.execute(
      'SELECT * FROM songs ORDER BY release_date DESC'
    );

    res.json({
      success: true,
      songs
    });
  } catch (error) {
    console.error('Get songs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send newsletter emails
app.post('/api/send-newsletter', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const [users] = await db.execute(
      'SELECT email FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0 || users[0].email !== 'admin@futons.com') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { type, data } = req.body;

    // Get all subscribed users
    const [subscribers] = await db.execute(
      'SELECT name, email FROM users WHERE newsletter_subscribed = 1'
    );

    if (subscribers.length === 0) {
      return res.json({
        success: true,
        message: 'No subscribers to send emails to'
      });
    }

    // Create email content based on type
    let subject, html;
    
    if (type === 'new-concert') {
      subject = `🎸 New Concert Alert: ${data.title}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6c5ce7;">🎸 The Futons - New Concert!</h2>
          <h3>${data.title}</h3>
          <p><strong>Date:</strong> ${new Date(data.date).toLocaleDateString()}</p>
          <p><strong>Venue:</strong> ${data.venue}</p>
          ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
          <p>Don't miss out on our upcoming performance!</p>
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
        html: html.replace('{{name}}', subscriber.name)
      });
    });

    await Promise.all(emailPromises);

    res.json({
      success: true,
      message: `Newsletter sent to ${subscribers.length} subscribers`
    });
  } catch (error) {
    console.error('Send newsletter error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Contact form submission
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Store in database
    await db.execute(
      'INSERT INTO contact_submissions (name, email, message) VALUES (?, ?, ?)',
      [name, email, message]
    );

    res.json({
      success: true,
      message: 'Contact form submitted successfully'
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎸 The Futons API server is running on port ${PORT}`);
});
