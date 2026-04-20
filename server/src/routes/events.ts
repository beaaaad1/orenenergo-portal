import { Router, Response } from 'express'
import pool from '../db'
import authMiddleware, { AuthRequest } from '../middleware/auth'

const router = Router()

// Получить все события
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT * FROM events
      ORDER BY date ASC
    `)
    res.json(result.rows)
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// Создать событие (только ADMIN)
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      res.status(403).json({ message: 'Нет прав' })
      return
    }

    const { title, description, date } = req.body

    const result = await pool.query(`
      INSERT INTO events (title, description, date)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [title, description || null, date])

    res.status(201).json(result.rows[0])
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// Удалить событие (только ADMIN)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      res.status(403).json({ message: 'Нет прав' })
      return
    }

    await pool.query('DELETE FROM events WHERE id = $1', [req.params.id])
    res.json({ message: 'Событие удалено' })
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

export default router