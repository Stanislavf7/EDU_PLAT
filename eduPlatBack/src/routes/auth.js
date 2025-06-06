const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const router = express.Router();

// Регистрация
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, hashedPassword, 'user']
    );
    req.session.user = result.rows[0];
    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(400).json({ error: 'Registration failed: ' + error.message });
  }
});

// Вход
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    req.session.user = { id: user.id, username: user.username, email: user.email, role: user.role, img: user.img_id };
    res.json({ user: req.session.user });
  } catch (error) {
    res.status(400).json({ error: 'Login failed: ' + error.message });
  }
});

// После существующих маршрутов в auth.js
router.get('/me', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user: req.session.user });
});

// После router.get('/me', ...)
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out' });
  });
});

module.exports = router;