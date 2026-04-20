import { Router, Response } from 'express'
import pool from '../db'
import authMiddleware, { AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id, role } = req.user!
    const notifications: any[] = []

    // Последние новости
    const news = await pool.query(`
      SELECT id, title, created_at
      FROM news
      ORDER BY created_at DESC
      LIMIT 3
    `)
    news.rows.forEach(n => {
      notifications.push({
        id: `news-${n.id}`,
        type: 'news',
        text: `Новая новость: ${n.title}`,
        date: n.created_at,
        link: '/news',
      })
    })

    // Задачи назначенные на меня
    const tasks = await pool.query(`
      SELECT t.id, t.title, t.created_at
      FROM tasks t
      WHERE t.assignee_id = $1
      ORDER BY t.created_at DESC
      LIMIT 3
    `, [id])
    tasks.rows.forEach(t => {
      notifications.push({
        id: `task-${t.id}`,
        type: 'task',
        text: `Вам назначена задача: ${t.title}`,
        date: t.created_at,
        link: '/tasks',
      })
    })

    // Заявки на отпуск (только для ADMIN и MANAGER)
    if (role === 'ADMIN' || role === 'MANAGER') {
      const vacations = await pool.query(`
        SELECT v.id, u.name, v.created_at
        FROM vacations v
        JOIN users u ON v.user_id = u.id
        WHERE v.status = 'PENDING'
        ORDER BY v.created_at DESC
        LIMIT 3
      `)
      vacations.rows.forEach(v => {
        notifications.push({
          id: `vacation-${v.id}`,
          type: 'vacation',
          text: `Заявка на отпуск от ${v.name}`,
          date: v.created_at,
          link: '/vacations',
        })
      })
    }

    // Предстоящие события
    const events = await pool.query(`
      SELECT id, title, date
      FROM events
      WHERE date >= NOW()
      ORDER BY date ASC
      LIMIT 2
    `)
    events.rows.forEach(e => {
      notifications.push({
        id: `event-${e.id}`,
        type: 'event',
        text: `Событие: ${e.title}`,
        date: e.date,
        link: '/events',
      })
    })


    notifications.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    res.json(notifications.slice(0, 10))
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

export default router