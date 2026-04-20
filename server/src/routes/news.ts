import { Router, Response } from 'express'
import pool from '../db'
import authMiddleware, { AuthRequest } from '../middleware/auth'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const router = Router()

// --- НАСТРОЙКА ХРАНИЛИЩА ---
const uploadDir = path.join(__dirname, '../../uploads/news')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, `news-${uniqueSuffix}${path.extname(file.originalname)}`)
  }
})

const upload = multer({ storage })

// Получить все новости
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT n.*, u.name as author_name 
      FROM news n 
      JOIN users u ON n.author_id = u.id 
      ORDER BY n.pinned DESC, n.created_at DESC
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// Создать новость (ADMIN ONLY)
router.post('/', authMiddleware, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') return res.status(403).json({ message: 'Нет прав' })

    const { title, content, category, urgent, pinned } = req.body

    // Формируем URL картинки, если она загружена
    const imageUrl = req.file
      ? `http://localhost:5000/uploads/news/${req.file.filename}`
      : null

    const result = await pool.query(`
      INSERT INTO news (title, content, category, urgent, pinned, author_id, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      title,
      content,
      category,
      urgent === 'true', // FormData передает булевы значения как строки
      pinned === 'true',
      req.user!.id,
      imageUrl
    ])

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// Удалить новость
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') return res.status(403).json({ message: 'Нет прав' })
    await pool.query('DELETE FROM news WHERE id = $1', [req.params.id])
    res.json({ message: 'Публикация удалена' })
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// Получить одну конкретную новость по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT n.*, u.name as author_name 
      FROM news n 
      JOIN users u ON n.author_id = u.id 
      WHERE n.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Статья не найдена' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router