import { Router, Response } from 'express'
import pool from '../db'
import authMiddleware, { AuthRequest } from '../middleware/auth'

const router = Router()

// Получить все отпуска
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT v.*, u.name as user_name, u.department
      FROM vacations v
      JOIN users u ON v.user_id = u.id
      ORDER BY v.start_date ASC
    `)
    res.json(result.rows)
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// Подать заявку на отпуск
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, comment } = req.body

    const result = await pool.query(`
      INSERT INTO vacations (user_id, start_date, end_date, comment)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [req.user!.id, startDate, endDate, comment || null])

    res.status(201).json(result.rows[0])
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// Одобрить или отклонить отпуск (только ADMIN и MANAGER)
router.put('/:id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.user!
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      res.status(403).json({ message: 'Нет прав' })
      return
    }

    const { status } = req.body

    const result = await pool.query(`
      UPDATE vacations SET status = $1
      WHERE id = $2
      RETURNING *
    `, [status, req.params.id])

    res.json(result.rows[0])
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

export default router