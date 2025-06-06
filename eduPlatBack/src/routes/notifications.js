const express = require('express');
const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Настройка хранилища для файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads'); 
    fs.mkdir(uploadPath, { recursive: true }).then(() => cb(null, uploadPath));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

// Фильтр для типов файлов
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/png', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PNG, PDF, and DOCX files are allowed'), false);
  }
};

// Инициализация multer
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

// Получение всех уведомлений
router.get('/', async (req, res) => {
  if (!req.session.user?.id || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  try {
    const result = await pool.query(`
      SELECT n.*, u.username 
      FROM notifications n 
      LEFT JOIN users u ON n.user_id = u.id 
      ORDER BY n.created_at DESC
    `);
    res.json({ notifications: result.rows });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications: ' + error.message });
  }
});

// Создание уведомления
router.post('/', upload.array('attachments', 5), async (req, res) => {
  const { type, message, user_id, metadata } = req.body;
  if (!type || !message) {
    return res.status(400).json({ error: 'Type and message are required' });
  }
  try {
    let parsedMetadata = {};
    try {
      parsedMetadata = JSON.parse(metadata || '{}');
    } catch (e) {
      console.error('Failed to parse metadata:', e);
    }

    // Добавляем пути к файлам в метаданные
    if (req.files && req.files.length > 0) {
      parsedMetadata.attachments = req.files.map(file => `/uploads/${file.filename}`);
    }

    const result = await pool.query(
      'INSERT INTO notifications (type, message, user_id, metadata) VALUES ($1, $2, $3, $4) RETURNING *',
      [type, message, user_id || null, parsedMetadata]
    );
    res.json({ notification: result.rows[0] });
  } catch (error) {
    console.error('Failed to create notification:', error);
    res.status(500).json({ error: 'Failed to create notification: ' + error.message });
  }
});

// Обновление статуса уведомления
router.patch('/:id', async (req, res) => {
  if (!req.session.user?.id || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { id } = req.params;
  const { is_read } = req.body;
  if (typeof is_read !== 'boolean') {
    return res.status(400).json({ error: 'is_read must be a boolean' });
  }
  try {
    const result = await pool.query(
      'UPDATE notifications SET is_read = $1 WHERE id = $2 RETURNING *',
      [is_read, id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ notification: result.rows[0] });
  } catch (error) {
    console.error('Failed to update notification:', error);
    res.status(500).json({ error: 'Failed to update notification: ' + error.message });
  }
});

// Удаление уведомления
router.delete('/:id', async (req, res) => {
  if (!req.session.user?.id || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM notifications WHERE id = $1 RETURNING *', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Failed to delete notification:', error);
    res.status(500).json({ error: 'Failed to delete notification: ' + error.message });
  }
});

module.exports = router;