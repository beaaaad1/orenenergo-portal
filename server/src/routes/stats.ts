import { Router, Response } from 'express'
import pool from '../db'
import authMiddleware, { AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Задачи по статусам
    const tasksByStatus = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM tasks
      GROUP BY status
    `)

    // Задачи по приоритетам
    const tasksByPriority = await pool.query(`
      SELECT priority, COUNT(*) as count
      FROM tasks
      GROUP BY priority
    `)

    // Новости по месяцам (последние 6 месяцев)
    const newsByMonth = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'Mon') as month,
        COUNT(*) as count
      FROM news
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `)

    // Пользователи по ролям
    const usersByRole = await pool.query(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `)

    // Отпуска по статусам
    const vacationsByStatus = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM vacations
      GROUP BY status
    `)

    res.json({
      tasksByStatus: tasksByStatus.rows,
      tasksByPriority: tasksByPriority.rows,
      newsByMonth: newsByMonth.rows,
      usersByRole: usersByRole.rows,
      vacationsByStatus: vacationsByStatus.rows,
    })
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

export default router