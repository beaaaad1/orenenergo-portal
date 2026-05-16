import { Router, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import pool from '../db'
import authMiddleware, { AuthRequest } from '../middleware/auth'

const router = Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, unique + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // СТАРОЕ НЕ МЕНЯЕМ: просто добавили '.html' в конец массива разрешенных типов
    const allowed = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.png', '.jpg', '.html']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Недопустимый тип файла'))
    }
  }
})

// Получить все документы
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { category, department } = req.query
    let query = `
      SELECT d.*, u.name as uploaded_by_name
      FROM documents d
      JOIN users u ON d.user_id = u.id
      WHERE 1=1
    `
    const params: any[] = []

    if (category) {
      params.push(category)
      query += ` AND d.category = $${params.length}`
    }
    if (department) {
      params.push(department)
      query += ` AND d.department = $${params.length}`
    }

    query += ' ORDER BY d.created_at DESC'

    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// Загрузить документ
router.post('/', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'Файл не загружен' })
      return
    }

    const { title, category, department } = req.body

    const result = await pool.query(`
      INSERT INTO documents (title, filename, filepath, category, department, user_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      title || req.file.originalname,
      req.file.originalname,
      req.file.filename,
      category || 'general',
      department || null,
      req.user!.id
    ])

    res.status(201).json(result.rows[0])
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// Скачать документ
router.get('/:id/download', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM documents WHERE id = $1',
      [req.params.id]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Документ не найден' })
      return
    }

    const doc = result.rows[0]
    const filepath = path.join(__dirname, '../../uploads', doc.filepath)

    if (!fs.existsSync(filepath)) {
      res.status(404).json({ message: 'Файл не найден на сервере' })
      return
    }

    res.download(filepath, doc.filename)
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// Удалить документ
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN' && req.user!.role !== 'MANAGER') {
      res.status(403).json({ message: 'Нет прав' })
      return
    }

    const result = await pool.query(
      'SELECT * FROM documents WHERE id = $1',
      [req.params.id]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Документ не найден' })
      return
    }

    const doc = result.rows[0]
    const filepath = path.join(__dirname, '../../uploads', doc.filepath)

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
    }

    await pool.query('DELETE FROM documents WHERE id = $1', [req.params.id])
    res.json({ message: 'Документ удалён' })
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

export default router