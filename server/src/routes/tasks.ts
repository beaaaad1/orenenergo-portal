import { Router, Response } from 'express'
import pool from '../db'
import authMiddleware, { AuthRequest } from '../middleware/auth'

const router = Router()

// Получить все задачи
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT t.*, 
        u1.name as author_name,
        u2.name as assignee_name
      FROM tasks t
      JOIN users u1 ON t.author_id = u1.id
      LEFT JOIN users u2 ON t.assignee_id = u2.id
      ORDER BY t.created_at DESC
    `)
    res.json(result.rows)
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// Получить мои задачи
router.get('/my', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT t.*,
        u1.name as author_name,
        u2.name as assignee_name
      FROM tasks t
      JOIN users u1 ON t.author_id = u1.id
      LEFT JOIN users u2 ON t.assignee_id = u2.id
      WHERE t.assignee_id = $1 OR t.author_id = $1
      ORDER BY t.created_at DESC
    `, [req.user!.id])
    res.json(result.rows)
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// Создать задачу
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, priority, assigneeId, deadline } = req.body

    const result = await pool.query(`
      INSERT INTO tasks (title, description, priority, author_id, assignee_id, deadline)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [title, description, priority || 'MEDIUM', req.user!.id, assigneeId || null, deadline || null])

    res.status(201).json(result.rows[0])
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// Обновить статус задачи
router.put('/:id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body

    const result = await pool.query(`
      UPDATE tasks SET status = $1
      WHERE id = $2
      RETURNING *
    `, [status, req.params.id])

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Задача не найдена' })
      return
    }

    res.json(result.rows[0])
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// Удалить задачу
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id])
    res.json({ message: 'Задача удалена' })
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

export default router