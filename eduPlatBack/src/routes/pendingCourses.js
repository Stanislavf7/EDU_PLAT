const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const pool = require('../config/db');
const router = express.Router();

// Валидация структуры шага fix-error
const validateFixErrorStep = (step) => {
  if (step.type === 'fix-error') {
    if (typeof step.initialCode !== 'string' || !step.initialCode.trim()) {
      return 'initialCode must be a non-empty string';
    }
    if (typeof step.correctCode !== 'string' || !step.correctCode.trim()) {
      return 'correctCode must be a non-empty string';
    }
  }
  return null;
};

// Валидация структуры курса
const validateCourseData = (courseData) => {
  if (!courseData.modules || !Array.isArray(courseData.modules)) {
    return 'modules must be an array';
  }
  for (const module of courseData.modules) {
    if (!module.steps || !Array.isArray(module.steps)) {
      return 'steps must be an array';
    }
    for (const step of module.steps) {
      const error = validateFixErrorStep(step);
      if (error) return error;
    }
  }
  return null;
};

// Получение метаданных всех черновиков
router.get('/', async (req, res) => {
  if (!req.session.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const result = await pool.query(
      'SELECT * FROM pending_courses WHERE creator_id = $1',
      [req.session.user.id]
    );
    res.json({ courses: result.rows });
  } catch (error) {
    console.error('Failed to fetch pending courses:', error);
    res.status(500).json({ error: 'Failed to fetch pending courses' });
  }
});

// Получение полного черновика по ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM pending_courses WHERE id = $1', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Pending course not found' });
    }
    const courseMeta = result.rows[0];
    const jsonPath = courseMeta.json_path;
    try {
      const courseData = await fs.readFile(jsonPath, 'utf-8');
      const courseJson = JSON.parse(courseData);
      const fullCourse = { ...courseJson, version: courseMeta.version, original_course_id: courseMeta.original_course_id };
      res.json(fullCourse);
    } catch (error) {
      console.error('Failed to read pending course file:', error);
      return res.status(500).json({ error: 'Failed to read pending course file' });
    }
  } catch (error) {
    console.error('Failed to fetch pending course:', error);
    res.status(500).json({ error: 'Failed to fetch pending course' });
  }
});

// Получение предыдущей версии курса
router.get('/course-versions/:id', async (req, res) => {
  if (!req.session.user?.id || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT version, json_path FROM pending_courses WHERE id = $1', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Course not found' });
    }
    const { version, json_path } = result.rows[0];
    if (version <= 1) {
      return res.json({ version: null });
    }
    const prevJsonPath = path.join(__dirname, '../../pending_json', `${id}_v${version - 1}.json`);
    try {
      const versionData = await fs.readFile(prevJsonPath, 'utf-8');
      res.json({ version: JSON.parse(versionData) });
    } catch {
      return res.json({ version: null });
    }
  } catch (error) {
    console.error('Failed to fetch course version:', error);
    res.status(500).json({ error: 'Failed to fetch course version' });
  }
});

// Создание или обновление черновика
router.post('/', async (req, res) => {
  if (!req.session.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { id, original_course_id, title, description, fulldescription, difficulty, modules, objectives, instructor, status, version, prerequisites } = req.body;
  let courseData;

  // Валидация структуры курса
  const validationError = validateCourseData({ modules });
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  // Проверяем, существует ли черновик
  const existingCourse = await pool.query('SELECT * FROM pending_courses WHERE id = $1', [id]);
  if (existingCourse.rows.length > 0) {
    // Обновление существующего черновика
    const jsonPath = existingCourse.rows[0].json_path;
    let existingData;
    try {
      const existingJson = await fs.readFile(jsonPath, 'utf-8');
      existingData = JSON.parse(existingJson);
    } catch (error) {
      console.error('Failed to read existing course:', error);
      return res.status(500).json({ error: 'Failed to read existing course file' });
    }
    courseData = {
      ...existingData,
      id,
      title: title || existingData.title || '',
      description: description || existingData.description || '',
      fulldescription: fulldescription || existingData.fulldescription || '',
      difficulty: difficulty || existingData.difficulty || 'Beginner',
      modules: modules || existingData.modules || [],
      objectives: objectives || [],
      prerequisites: prerequisites || existingData.prerequisites || 'None',
      instructor: instructor || existingData.instructor || { name: req.session.user.username || '', title: 'Course Author' },
      status: status || existingData.status || 'draft',
      creator_id: req.session.user.id,
      original_course_id: original_course_id || existingData.original_course_id || null,
    };
  } else if (original_course_id) {
    // Создание черновика на основе оригинального курса
    const originalPath = path.join(__dirname, '../../courses', `${original_course_id}.json`);
    try {
      const originalData = await fs.readFile(originalPath, 'utf-8');
      courseData = JSON.parse(originalData);
      courseData.id = id;
      courseData.original_course_id = original_course_id;
      courseData.status = 'draft';
      courseData.creator_id = req.session.user.id;
    } catch (error) {
      console.error('Failed to read original course:', error);
      return res.status(500).json({ error: 'Failed to read original course file' });
    }
  } else {
    // Создание нового курса с нуля
    courseData = {
      id,
      title: title || '',
      description: description || '',
      fulldescription: fulldescription || '',
      difficulty: difficulty || 'Beginner',
      modules: modules || [],
      objectives: objectives || [],
      prerequisites: prerequisites || 'None',
      instructor: instructor || { name: req.session.user.username || '', title: 'Course Author' },
      status: status || 'draft',
      creator_id: req.session.user.id,
      original_course_id: original_course_id || null
    };
  }

  const jsonPath = path.join(__dirname, '../../pending_json', `${id}.json`);
  try {
    const existingCourse = await pool.query('SELECT version FROM pending_courses WHERE id = $1', [id]);
    let newVersion = version || 1;
    if (existingCourse.rows.length) {
      newVersion = version || existingCourse.rows[0].version + 1;
    }

    await fs.writeFile(jsonPath, JSON.stringify(courseData, null, 2));
    const result = await pool.query(
      `INSERT INTO pending_courses (id, original_course_id, title, json_path, creator_id, status, created_at, description, difficulty, version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE
       SET title = $3, json_path = $4, creator_id = $5, status = $6, created_at = $7, description = $8, difficulty = $9, version = $10
       RETURNING *`,
      [id, original_course_id || null, courseData.title, jsonPath, req.session.user.id, courseData.status, new Date(), courseData.description, courseData.difficulty, newVersion]
    );
    res.json({ course: result.rows[0] });
  } catch (error) {
    console.error('Failed to save pending course:', error);
    res.status(500).json({ error: 'Failed to save pending course' });
  }
});

// Публикация черновика
router.post('/:id/publish', async (req, res) => {
  if (!req.session.user?.id || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const pendingId = req.params.id;

  try {
    // Получение черновика
    const pendingRes = await pool.query(
      'SELECT * FROM pending_courses WHERE id = $1',
      [pendingId]
    );
    if (!pendingRes.rows.length) {
      return res.status(404).json({ error: 'Pending course not found' });
    }
    const pending = pendingRes.rows[0];
    const pendingJsonPath = pending.json_path;
    let courseData;
    try {
      const rawData = await fs.readFile(pendingJsonPath, 'utf-8');
      courseData = JSON.parse(rawData);
    } catch (error) {
      console.error('Failed to read pending course file:', error);
      return res.status(500).json({ error: 'Failed to read pending course file' });
    }

    // Валидация структуры курса
    const validationError = validateCourseData(courseData);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Приведение ID к числовому
    const numericId = parseInt(pendingId.slice(1));
    if (isNaN(numericId)) {
      return res.status(400).json({ error: 'Invalid pending ID format' });
    }
    courseData.id = numericId;

    const now = new Date();
    const version = pending.version || 1;
    const coursesDir = path.join(__dirname, '../../courses');
    await fs.mkdir(coursesDir, { recursive: true });
    const publicJsonPath = path.join(coursesDir, `${numericId}.json`);
    const publicJsonUrl = `/courses/${numericId}.json`;

    if (pendingId.startsWith('c')) {
      // Обновление существующего курса
      const originalCourseId = numericId;

      const updateCourseQuery = `
        UPDATE courses
        SET
          title = $1,
          description = $2,
          difficulty = $3,
          version = $4,
          created_at = $5
        WHERE id = $6
      `;
      await pool.query(updateCourseQuery, [
        courseData.title,
        courseData.description,
        courseData.difficulty,
        version,
        now,
        originalCourseId
      ]);

      await fs.writeFile(publicJsonPath, JSON.stringify(courseData, null, 2));

      await pool.query('DELETE FROM pending_courses WHERE id = $1', [pendingId]);
      try {
        await fs.unlink(pendingJsonPath);
      } catch {
        // Игнорируем ошибку, если файла нет
      }

      return res.json({
        course_id: originalCourseId,
        message: 'Course updated successfully'
      });
    }

    if (pendingId.startsWith('n')) {
      // Создание нового курса
      const newCourseId = numericId;
      courseData.id = newCourseId;

      await fs.writeFile(publicJsonPath, JSON.stringify(courseData, null, 2));

      const insertCourseQuery = `
        INSERT INTO courses
          (id, title, description, difficulty, creator_id, json_path, is_published, created_at, version)
        VALUES
          ($1, $2, $3, $4, $5, $6, TRUE, $7, $8)
      `;
      await pool.query(insertCourseQuery, [
        newCourseId,
        courseData.title,
        courseData.description,
        courseData.difficulty,
        pending.creator_id,
        publicJsonUrl,
        now,
        version
      ]);

      await pool.query('DELETE FROM pending_courses WHERE id = $1', [pendingId]);
      try {
        await fs.unlink(pendingJsonPath);
      } catch {
        // Игнорируем ошибку, если файла нет
      }

      return res.json({
        course_id: newCourseId,
        message: 'New course created successfully'
      });
    }

    return res.status(400).json({ error: 'Invalid pending ID prefix' });
  } catch (error) {
    console.error('Failed to publish pending course:', error);
    res.status(500).json({ error: 'Failed to publish course' });
  }
});

module.exports = router;