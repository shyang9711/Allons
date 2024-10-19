const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // You'll need to install this: npm install jsonwebtoken
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('JWT_SECRET is not set in the environment variables');
  process.exit(1);
}

const app = express();
const port = 5000; // Make sure this matches the port in your axios calls

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

// Check username availability
app.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    res.json({ available: result.rows.length === 0 });
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User registration
app.post('/signup', async (req, res) => {
  try {
    const { username, email, password, dateOfBirth, nationality, phoneNumber, gender, languagePreferences } = req.body;
    
    // Check if username or email already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate random user ID
    const userId = uuidv4();

    // Insert new user
    await pool.query(
      'INSERT INTO users (user_id, username, email, password, date_of_birth, nationality, phone_number, gender, language_preferences) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [userId, username, email, hashedPassword, dateOfBirth, nationality, phoneNumber, gender, languagePreferences]
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Profile route
app.get('/profile', authenticateToken, async (req, res) => {
  console.log('Received profile request for user:', req.user);
  try {
    const result = await pool.query('SELECT username, email, language_preferences FROM users WHERE user_id = $1', [req.user.userId]);
    
    if (result.rows.length > 0) {
      console.log('Profile found:', result.rows[0]);
      res.json(result.rows[0]);
    } else {
      console.log('User not found for ID:', req.user.userId);
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update email route
app.put('/profile/email', authenticateToken, async (req, res) => {
  const { email } = req.body;
  try {
    await pool.query('UPDATE users SET email = $1 WHERE user_id = $2', [email, req.user.userId]);
    res.json({ message: 'Email updated successfully' });
  } catch (error) {
    console.error('Error updating email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update password route
app.put('/profile/password', authenticateToken, async (req, res) => {
  const { password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password = $1 WHERE user_id = $2', [hashedPassword, req.user.userId]);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add language preference route (with text[])
app.post('/profile/languages', authenticateToken, async (req, res) => {
  const { language } = req.body;

  try {
    // Fetch the current language preferences
    const result = await pool.query('SELECT language_preferences FROM users WHERE user_id = $1', [req.user.userId]);
    let languagePreferences = result.rows[0].language_preferences || [];

    // Check if the language is already in the array
    if (!languagePreferences.includes(language)) {
      // Use array_append to add the new language to the array
      await pool.query(
        'UPDATE users SET language_preferences = array_append(language_preferences, $1) WHERE user_id = $2',
        [language, req.user.userId]
      );
    }

    res.json({ message: 'Language preference added successfully' });
  } catch (error) {
    console.error('Error adding language preference:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove language preference route (with text[])
app.delete('/profile/languages/:language', authenticateToken, async (req, res) => {
  const { language } = req.params;

  try {
    // Fetch the current language preferences
    const result = await pool.query('SELECT language_preferences FROM users WHERE user_id = $1', [req.user.userId]);
    let languagePreferences = result.rows[0].language_preferences || [];

    // Use array_remove to remove the specified language from the array
    await pool.query(
      'UPDATE users SET language_preferences = array_remove(language_preferences, $1) WHERE user_id = $2',
      [language, req.user.userId]
    );

    res.json({ message: 'Language preference removed successfully' });
  } catch (error) {
    console.error('Error removing language preference:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
