// index.js
const express = require('express')
const cors = require('cors')
const session = require('express-session')
const authRoutes = require('./routes/auth')
const courseRoutes = require('./routes/courses')
const userRoutes = require('./routes/user')
const pendingCoursesRoutes = require('./routes/pendingCourses')
const notificationsRoutes = require('./routes/notifications')
const path = require('path')
const fs = require('fs/promises')
require('dotenv').config()

const app = express()

// CORS и JSON
app.use(
  cors({ origin: 'http://localhost:5173', credentials: true })
)
app.use(express.json())
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 30 * 60 * 1000 }
  })
)

// Маршрут для загрузки файлов: проверяем наличие и отдаем через res.download
app.get('/uploads/:filename', async (req, res) => {
  const filePath = path.join(__dirname, '../uploads', req.params.filename)
  try {
    await fs.access(filePath, fs.constants.F_OK)
    return res.download(filePath)
  } catch (error) {
    console.error(`File not found: ${filePath}`)
    return res.status(404).json({ error: 'File not found' })
  }
})

// При необходимости оставить предпросмотр, можно также подключить статику под другим путём
app.use(
  '/preview/uploads',
  express.static(path.join(__dirname, '../uploads'))
)

// Маршруты API
app.use('/api/auth', authRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/user', userRoutes)
app.use('/api/pending-courses', pendingCoursesRoutes)
app.use('/api/notifications', notificationsRoutes)

// Тестовый маршрут
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' })
})

const PORT = process.env.PORT || 5001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
