const express = require('express');
const pool = require('../config/db');
const router = express.Router();

// Получить прогресс пользователя
router.get('/progress', async (req, res) => {
  if (!req.session.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const result = await pool.query(
      'SELECT course_id, completed_steps FROM user_progress WHERE user_id = $1',
      [req.session.user.id]
    );
    const progress = {};
    result.rows.forEach(row => {
      progress[row.course_id] = row.completed_steps;
    });
    res.json({ progress });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch progress: ' + error.message });
  }
});

// Обновить прогресс
router.post('/progress', async (req, res) => {
  if (!req.session.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { courseId, completedSteps } = req.body;
  try {
    await pool.query(
      'INSERT INTO user_progress (user_id, course_id, completed_steps) VALUES ($1, $2, $3) ON CONFLICT (user_id, course_id) DO UPDATE SET completed_steps = $3',
      [req.session.user.id, courseId, completedSteps]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update progress: ' + error.message });
  }
});

// Получение списка пользователей
router.get('/', async (req, res) => {
  if (!req.session.user?.id || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, created_at::text FROM users ORDER BY created_at DESC'
    );
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Failed to fetch users: ' + error.message });
  }
});

// Обновление роли пользователя
router.patch('/:id', async (req, res) => {
  if (!req.session.user?.id || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { id } = req.params;
  const { role } = req.body;
  if (!['admin', 'creator', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  try {
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, role, created_at::text',
      [role, id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Failed to update user role:', error);
    res.status(500).json({ error: 'Failed to update user role: ' + error.message });
  }
});

// Удаление пользователя
router.delete('/:id', async (req, res) => {
  if (!req.session.user?.id || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { id } = req.params;
  try {
    // Удаляем прогресс пользователя
    await pool.query('DELETE FROM user_progress WHERE user_id = $1', [id]);
    // Удаляем пользователя
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    res.status(500).json({ error: 'Failed to delete user: ' + error.message });
  }
});

// Обновление профиля пользователя
router.patch('/', async (req, res) => {
  if (!req.session.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { username, email, img } = req.body;
  if (!username && !email && img === undefined) {
    return res.status(400).json({ error: 'No fields provided for update' });
  }
  try {
    // Валидация
    if (username && (typeof username !== 'string' || username.length < 3 || username.length > 50)) {
      return res.status(400).json({ error: 'Invalid username: must be 3-50 characters' });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (img !== undefined && (typeof img !== 'number' || img < 1 || img > 4)) {
      return res.status(400).json({ error: 'Invalid avatar: must be a number between 1 and 4' });
    }

    // Формируем запрос динамически
    const fields = [];
    const values = [];
    let index = 1;
    if (username) {
      fields.push(`username = $${index++}`);
      values.push(username);
    }
    if (email) {
      fields.push(`email = $${index++}`);
      values.push(email);
    }
    if (img !== undefined) {
      fields.push(`img_id = $${index++}`);
      values.push(img);
    }
    values.push(req.session.user.id);

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${index} RETURNING id, username, email, role, img_id, created_at::text`;
    const result = await pool.query(query, values);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Failed to update profile:', error);
    res.status(500).json({ error: 'Failed to update profile: ' + error.message });
  }
});

module.exports = router;