import { Router, Response } from 'express'
import pool from '../db'
import authMiddleware, { AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { q } = req.query
    if (!q || String(q).trim().length < 2) {
      res.json({ news: [], documents: [], users: [] })
      return
    }

    const search = `%${String(q).toLowerCase()}%`

    const news = await pool.query(`
      SELECT id, title, category, created_at
      FROM news
      WHERE LOWER(title) LIKE $1 OR LOWER(content) LIKE $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [search])

    const documents = await pool.query(`
      SELECT id, title, filename, category, created_at
      FROM documents
      WHERE LOWER(title) LIKE $1 OR LOWER(filename) LIKE $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [search])

    const users = await pool.query(`
      SELECT id, name, email, role, department
      FROM users
      WHERE LOWER(name) LIKE $1
        OR LOWER(email) LIKE $1
        OR LOWER(department) LIKE $1
      LIMIT 5
    `, [search])

    res.json({
      news: news.rows,
      documents: documents.rows,
      users: users.rows,
    })
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

export default router