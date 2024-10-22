const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // You'll need to install this: npm install jsonwebtoken
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;
const axios = require('axios');
const rateLimit = require('express-rate-limit');

if (!JWT_SECRET) {
  console.error('JWT_SECRET is not set in the environment variables');
  process.exit(1);
}

const app = express();
const port = 5000; // Make sure this matches the port in your axios calls

// Middleware
app.use(cors({
  origin: 'http://localhost:8080' // or whatever origin your React app is running on
}));
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
  console.log('Auth header:', authHeader);

  if (!authHeader) {
    console.log('No Authorization header provided');
    return res.sendStatus(401);
  }

  const [bearer, token] = authHeader.split(' ');
  
  if (bearer !== 'Bearer' || !token) {
    console.log('Malformed Authorization header');
    return res.sendStatus(401);
  }

  console.log('Token extracted from header:', token);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.sendStatus(403);
    }
    req.user = user;
    console.log('Authenticated user:', user);
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
    const { firstName, lastName, username, email, password, dateOfBirth, nationality, phoneNumber, gender, languagePreferences } = req.body;

    // Log the received data
    console.log('Received signup data:', { firstName, lastName, username, email, dateOfBirth, nationality, phoneNumber, gender, languagePreferences });

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
    console.log('Inserting user with values:', [userId, username, email, hashedPassword, dateOfBirth, nationality, phoneNumber, gender, languagePreferences, firstName, lastName]);
    await pool.query(
      'INSERT INTO users (user_id, username, email, password, date_of_birth, nationality, phone_number, gender, language_preferences, first_name, last_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
      [userId, username, email, hashedPassword, dateOfBirth, nationality, phoneNumber, gender, languagePreferences, firstName, lastName]
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

// Delete account
app.delete('/profile', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE user_id = $1', [req.user.userId]);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Profile route
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  console.log('Received profile request for user:', req.user);
  try {
    const result = await pool.query('SELECT first_name, last_name, username, email, language_preferences FROM users WHERE user_id = $1', [req.user.userId]);
    
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

// Profile route
app.get('/profile/:userId', authenticateToken, async (req, res) => {
  console.log('Received profile request for user:', req.params.userId);
  try {
    const result = await pool.query('SELECT first_name, last_name, username, email, language_preferences FROM users WHERE username = $1', [req.params.userId]);
    
    if (result.rows.length > 0) {
      console.log('Profile found:', result.rows[0]);
      res.json(result.rows[0]);
    } else {
      console.log('User not found for ID:', req.params.userId);
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

// Create group post route
app.post('/group_posts', authenticateToken, async (req, res) => {
  console.log('Received request to /group_posts');
  const { 
    title, 
    gender_preference, 
    language_preference, 
    age_range_min, 
    age_range_max, 
    group_size, 
    itinerary, 
    date_time, 
    location 
  } = req.body;
  console.log('Request body:', req.body);
  
  try {
    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    // Validate date_time
    const parsedDate = new Date(date_time);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date/time format' });
    }

    // Generate a unique UUID for the group post
    const postId = uuidv4();

    // Start a transaction
    await pool.query('BEGIN');

    const result = await pool.query(
      `INSERT INTO group_posts (
        id, host_user_id, user_ids, title, gender_preference, language_preference, 
        age_range_min, age_range_max, group_size, itinerary, date_time, location
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        postId,
        req.user.userId, 
        [req.user.userId],
        title,
        gender_preference,
        language_preference,
        age_range_min,
        age_range_max,
        group_size,
        itinerary,
        parsedDate.toISOString(),
        location
      ]
    );

    // Update user's group_posts
    await pool.query(
      `UPDATE users 
       SET group_posts = array_append(group_posts, $1) 
       WHERE user_id = $2`,
      [postId, req.user.userId]
    );

    // Commit the transaction
    await pool.query('COMMIT');

    console.log('Insert result:', result.rows[0]);

    res.status(201).json({
      message: 'Group post created successfully',
      post: result.rows[0]
    });
  } catch (error) {
    // Rollback the transaction in case of error
    await pool.query('ROLLBACK');
    console.error('Error creating group post:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get group posts route
app.get('/api/group_posts', authenticateToken, async (req, res) => {
  console.log('Received request to /api/group_posts');
  console.log('Query params:', req.query);
  
  try {
    const queryDate = new Date(req.query.date);
    const bounds = JSON.parse(req.query.bounds);
    const { _southWest, _northEast } = bounds;

    console.log('Parsed date:', queryDate);
    console.log('Parsed bounds:', { _southWest, _northEast });

    const result = await pool.query(
      `SELECT gp.*, u.username as host_username
       FROM group_posts gp
       JOIN users u ON gp.host_user_id = u.user_id
       WHERE gp.date_time >= $1 AND gp.date_time < $2
       AND CAST(SPLIT_PART(gp.location, ',', 1) AS FLOAT) BETWEEN $5 AND $6
       AND CAST(SPLIT_PART(gp.location, ',', 2) AS FLOAT) BETWEEN $3 AND $4
       ORDER BY gp.date_time ASC`,
      [
        queryDate,
        new Date(queryDate.getTime() + 24 * 60 * 60 * 1000),
        _southWest.lng,
        _northEast.lng,
        _southWest.lat,
        _northEast.lat
      ]
    );

    console.log('Query result:', result.rows);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching group posts:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Create a rate limiter
const geocodeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per windowMs
  message: 'Too many geocoding requests, please try again later.'
});

// Apply rate limiting to the geocoding route
app.get('/api/geocode', geocodeLimiter, async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: {
        format: 'json',
        lat,
        lon,
      },
      headers: {
        'User-Agent': 'YourAppName/1.0',
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching address from Nominatim:', error);
    res.status(500).json({ error: 'Failed to fetch address' });
  }
});

// Add this new route for user's Heritex data
app.get('/api/user/heritex', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching Heritex data for user:', req.user.userId);
    const result = await pool.query('SELECT heritex FROM users WHERE user_id = $1', [req.user.userId]);
    console.log('Query result:', result.rows);
    const heritexData = result.rows[0]?.heritex || {};
    console.log('Heritex data:', heritexData);
    res.json(heritexData);
  } catch (error) {
    console.error('Error fetching user Heritex data:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get Heritex route
app.get('/api/heritex', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM heritex ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching Heritex count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific group post by ID route
app.get('/api/group_posts/:id', authenticateToken, async (req, res) => {
  console.log('Received request to get specific group post');
  const { id } = req.params;

  try {
    const postResult = await pool.query(
      `SELECT gp.*, 
              u.username as host_username, 
              u.first_name as host_first_name, 
              u.last_name as host_last_name
       FROM group_posts gp
       JOIN users u ON gp.host_user_id = u.user_id
       WHERE gp.id = $1`,
      [id]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Group post not found' });
    }

    const post = postResult.rows[0];

    // Fetch users associated with the post
    const usersResult = await pool.query(
      `SELECT u.user_id, u.username, u.first_name, u.last_name
       FROM users u
       WHERE u.user_id = ANY($1::uuid[])`,
      [post.user_ids]
    );

    post.users = usersResult.rows;

    console.log('Query result:', post);
    res.json(post);
  } catch (error) {
    console.error('Error fetching specific group post:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Add this new route to fetch user posts
app.get('/api/posts/user/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  
  try {
    console.log('Fetching posts for user:', userId);
    
    // First, try to fetch the user by UUID
    let userResult = await pool.query(
      'SELECT * FROM users WHERE user_id::text = $1',
      [userId]
    );

    // If no user found, try to fetch by username
    if (userResult.rows.length === 0) {
      userResult = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [userId]
      );
    }

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    console.log('User found:', user);

    // Then, fetch the posts
    if (user.group_posts && user.group_posts.length > 0) {
      const postsResult = await pool.query(
        'SELECT * FROM group_posts WHERE id = ANY($1::uuid[]) ORDER BY date_time DESC',
        [user.group_posts]
      );
      console.log('Posts found:', postsResult.rows);
      res.json(postsResult.rows);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message, stack: error.stack });
  }
});

console.log('Routes registered:');
app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
    console.log(r.route.path)
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
