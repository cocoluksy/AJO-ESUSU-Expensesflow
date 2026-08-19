import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Register a new user
const register = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { email, password, first_name, last_name, business_name } = req.body;

    // Check if user already exists
    const userExists = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password - Use 12 rounds for better security
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert new user
    const result = await client.query(
      `INSERT INTO users (email, password, first_name, last_name, business_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, first_name, last_name, business_name, created_at`,
      [email, hashedPassword, first_name, last_name, business_name || null]
    );

    const user = result.rows[0];
    
    // Log user creation
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [user.id, 'CREATE', 'USER', user.id]
    );

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  } finally {
    client.release();
  }
};

// Login user
const login = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { email, password } = req.body;

    // Find user by email
    const result = await client.query(
      'SELECT id, email, password, first_name, last_name, business_name FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Log failed login attempt
      await client.query(
        `INSERT INTO audit_logs (action, entity_type)
         VALUES ($1, $2)`,
        ['FAILED_LOGIN', 'USER']
      );

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Log successful login
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type)
       VALUES ($1, $2, $3)`,
      [user.id, 'LOGIN', 'USER']
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Generate token
    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  } finally {
    client.release();
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT id, email, first_name, last_name, business_name, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile'
    });
  } finally {
    client.release();
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { first_name, last_name, business_name } = req.body;

    const result = await client.query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, business_name = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, email, first_name, last_name, business_name, updated_at`,
      [first_name, last_name, business_name, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Log update
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'UPDATE', 'USER', req.user.id, JSON.stringify({ first_name, last_name, business_name })]
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  } finally {
    client.release();
  }
};

export { register, login, getProfile, updateProfile };
