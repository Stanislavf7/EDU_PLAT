const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const pool = require('../config/db');
const router = express.Router();

// Функция для нормализации кода (удаление лишних пробелов и переносов строк)
const normalizeCode = (code) => {
  return code
    .replace(/\s+/g, ' ') // Заменяем множественные пробелы на один
    .replace(/;\s*/g, ';') // Удаляем пробелы после точки с запятой
    .trim();
};

// Получение всех курсов (для админ-панели, без фильтра is_published)
router.get('/', async (req, res) => {
  // if (!req.session.user?.id || req.session.user.role !== 'admin') {
  //   return res.status(403).json({ error: 'Access denied' });
  // }
  try {
    const result = await pool.query(
      'SELECT id, title, description, difficulty, creator_id, json_path, created_at::text, version, is_published FROM courses ORDER BY id'
    );
    res.json({ courses: result.rows });
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Получение курса по ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT json_path, version, is_published FROM courses WHERE id = $1',
      [id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Course not found' });
    }
    const jsonPath = path.join(__dirname, '..', '..', result.rows[0].json_path);
    try {
      const courseData = await fs.readFile(jsonPath, 'utf-8');
      const course = JSON.parse(courseData);
      course.is_published = result.rows[0].is_published;
      res.json(course);
    } catch (error) {
      console.error('Failed to read course file:', error);
      return res.status(500).json({ error: 'Failed to read course file' });
    }
  } catch (error) {
    console.error('Failed to fetch course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Получение количества участников
router.get('/:id/participants-count', async (req, res) => {
  if (!req.session.user?.id || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT COUNT(DISTINCT user_id) as count FROM user_progress WHERE course_id = $1',
      [id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Failed to fetch participants count:', error);
    res.status(500).json({ error: 'Failed to fetch participants count' });
  }
});

// Обновление статуса публикации
router.patch('/:id', async (req, res) => {
  if (!req.session.user?.id || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { id } = req.params;
  const { is_published } = req.body;
  if (typeof is_published !== 'boolean') {
    return res.status(400).json({ error: 'is_published must be a boolean' });
  }
  try {
    const result = await pool.query(
      'UPDATE courses SET is_published = $1 WHERE id = $2 RETURNING *',
      [is_published, id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json({ course: result.rows[0] });
  } catch (error) {
    console.error('Failed to update course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// Удаление курса
router.delete('/:id', async (req, res) => {
  if (!req.session.user?.id || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM courses WHERE id = $1 RETURNING *', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Course not found' });
    }
    const jsonPath = path.join(__dirname, '..', '..', result.rows[0].json_path);
    await fs.unlink(jsonPath).catch(err => console.error('Failed to delete JSON file:', err));
    res.json({ message: 'Course deleted' });
  } catch (error) {
    console.error('Failed to delete course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// Валидация кода для шага fix-error
router.post('/validate-code', async (req, res) => {
  if (!req.session.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const userId = req.session.user.id;
  const { courseId, stepIndex, userCode } = req.body;

  // Валидация входных данных
  if (!Number.isInteger(Number(courseId)) || !Number.isInteger(Number(stepIndex))) {
    return res.status(400).json({ error: 'Invalid courseId or stepIndex' });
  }
  if (typeof userCode !== 'string') {
    return res.status(400).json({ error: 'userCode must be a string' });
  }

  try {
    // Проверка записи на курс
    const progressQuery = await pool.query(
      'SELECT completed_steps FROM user_progress WHERE course_id = $1 AND user_id = $2',
      [courseId, userId]
    );
    if (!progressQuery.rows.length) {
      return res.status(403).json({ error: 'User not enrolled in course' });
    }

    // Проверка завершённости шага
    const completedSteps = progressQuery.rows[0].completed_steps || [];
    if (completedSteps.includes(stepIndex)) {
      return res.status(400).json({ error: 'Step already completed' });
    }

    // Получение данных курса
    const courseQuery = await pool.query(
      'SELECT json_path FROM courses WHERE id = $1',
      [courseId]
    );
    if (!courseQuery.rows.length) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const jsonPath = path.join(__dirname, '..', '..', courseQuery.rows[0].json_path);
    let courseData;
    try {
      courseData = await fs.readFile(jsonPath, 'utf-8');
    } catch (error) {
      console.error('Failed to read course file:', error);
      return res.status(500).json({ error: 'Failed to read course file' });
    }
    const course = JSON.parse(courseData);

    // Поиск шага (аналогично flatSteps в CourseProgress.vue)
    let targetStep = null;
    let globalStepIdx = 0;
    for (const module of course.modules || []) {
      for (const step of module.steps || []) {
        globalStepIdx++;
        if (globalStepIdx === stepIndex) {
          targetStep = step;
          break;
        }
      }
      if (targetStep) break;
    }

    if (!targetStep || targetStep.type !== 'fix-error') {
      return res.status(400).json({ error: 'Invalid step or not a fix-error type' });
    }

    // Проверка наличия correctCode
    if (!targetStep.correctCode || typeof targetStep.correctCode !== 'string') {
      return res.status(500).json({ error: 'Correct code not defined for this step' });
    }

    // Нормализация и сравнение кода
    const normalizedUserCode = normalizeCode(userCode);
    const normalizedCorrectCode = normalizeCode(targetStep.correctCode);
    const isCorrect = normalizedUserCode === normalizedCorrectCode;

    return res.json({
      correct: isCorrect,
      message: isCorrect ? 'Код верный' : 'Код содержит ошибки'
    });
  } catch (error) {
    console.error('Failed to validate code:', error);
    return res.status(500).json({ error: 'Failed to validate code' });
  }
});

module.exports = router;