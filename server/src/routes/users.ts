import { Router, Response } from 'express'
import pool from '../db'
import bcrypt from 'bcryptjs'
import authMiddleware, { AuthRequest } from '../middleware/auth'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const router = Router()

// --- НАСТРОЙКА ХРАНИЛИЩА ---
const avatarsDir = path.join(__dirname, '../../uploads/avatars')
const docsDir = path.join(__dirname, '../../uploads/documents')

if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true })
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true })

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarsDir),
  filename: (req, file, cb) => {
    const userId = (req as AuthRequest).user?.id || 'unknown'
    cb(null, `avatar-${userId}-${Date.now()}${path.extname(file.originalname)}`)
  }
})

const docsStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, docsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, `userdoc-${uniqueSuffix}${path.extname(file.originalname)}`)
  }
})

const uploadAvatar = multer({ storage: avatarStorage })
const uploadDoc = multer({ storage: docsStorage })

// --- 1. ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ ---
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.role, u.department, u.phone, 
        u.avatar AS avatar_url, u.employee_id, u.work_schedule, 
        u.experience, u.created_at,
        (SELECT COUNT(*) FROM tasks WHERE assignee_id = u.id AND status = 'DONE') as tasks_completed
      FROM users u
      WHERE u.id = $1
    `, [req.user!.id])

    if (result.rows.length === 0) return res.status(404).json({ message: 'Пользователь не найден' })

    const profile = result.rows[0];
    profile.tasks_completed = parseInt(profile.tasks_completed);

    res.json(profile)
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// --- 2. ОБНОВЛЕНИЕ ПРОФИЛЯ ---
router.put('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, department, employee_id, work_schedule, experience } = req.body
    const result = await pool.query(`
      UPDATE users 
      SET name = $1, phone = $2, department = $3, employee_id = $4, work_schedule = $5, experience = $6
      WHERE id = $7
      RETURNING id, name, email, role, department, phone, avatar AS avatar_url, employee_id, work_schedule, experience
    `, [name, phone, department, employee_id, work_schedule, experience, req.user!.id])
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

router.post('/upload-avatar', authMiddleware, uploadAvatar.single('avatar'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Файл не выбран' })
    const avatarUrl = `http://localhost:5000/uploads/avatars/${req.file.filename}`
    await pool.query('UPDATE users SET avatar = $1 WHERE id = $2', [avatarUrl, req.user!.id])
    res.json({ avatar_url: avatarUrl })
  } catch (error) {
    res.status(500).json({ message: 'Ошибка загрузки' })
  }
})

router.get('/:id/documents', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const targetId = parseInt(req.params.id as string)

    // Доступ имеют только сам владелец или администратор
    if (targetId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Нет доступа к документам этого пользователя' })
    }

    const result = await pool.query(
      "SELECT id, title, filename, filepath, created_at FROM documents WHERE user_id = $1 AND category = 'PERSONAL' ORDER BY created_at DESC",
      [targetId]
    )
    res.json(result.rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Ошибка сервера при получении документов' })
  }
})

router.post('/:id/documents', authMiddleware, uploadDoc.single('document'), async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Только администратор может загружать личные документы сотрудникам' })
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Файл не выбран' })
    }

    const targetUserId = req.params.id
    const fileUrl = `http://localhost:5000/uploads/documents/${req.file.filename}`

    const result = await pool.query(
      "INSERT INTO documents (title, filename, filepath, category, user_id) VALUES ($1, $2, $3, 'PERSONAL', $4) RETURNING *",
      [
        req.body.title || req.file.originalname,
        req.file.filename,
        fileUrl,
        targetUserId
      ]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Ошибка сохранения документа' })
  }
})

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Нет прав для создания пользователя' })
    }

    const { name, email, password, role, department, phone } = req.body

    // 1. Проверяем, не занят ли email
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' })
    }

    // 2. Хешируем пароль
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const newUser = await pool.query(
      `INSERT INTO users (name, email, password, role, department, phone) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, email, role`,
      [name, email, hashedPassword, role || 'EMPLOYEE', department, phone]
    )

    res.status(201).json(newUser.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Ошибка при создании пользователя' })
  }
})


router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, department FROM users ORDER BY id ASC')
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const result = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.role, u.department, u.phone, 
        u.avatar AS avatar_url, u.employee_id, u.work_schedule, 
        u.experience, u.created_at,
        (SELECT COUNT(*) FROM tasks WHERE assignee_id = u.id AND status = 'DONE') as tasks_completed
      FROM users u
      WHERE u.id = $1
    `, [id])

    if (result.rows.length === 0) return res.status(404).json({ message: 'Пользователь не найден' })

    const profile = result.rows[0]
    profile.tasks_completed = parseInt(profile.tasks_completed)
    res.json(profile)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') return res.status(403).json({ message: 'Нет прав' })
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id])
    res.json({ message: 'Пользователь удален' })
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при удалении' })
  }
})

router.put('/:id/role', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') return res.status(403).json({ message: 'Нет прав' })
    const { role } = req.body
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id])
    res.json({ message: 'Роль обновлена' })
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при обновлении роли' })
  }
})


// --- НОВОЕ: СМЕНА ПАРОЛЯ АДМИНИСТРАТОРОМ ---
router.put('/:id/password', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // 1. Проверяем, что запрос делает именно админ
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Только администратор может принудительно менять пароли' })
    }

    const userId = req.params.id
    const { password } = req.body

    if (!password || password.length < 4) {
      return res.status(400).json({ message: 'Пароль слишком короткий' })
    }

    // 2. Хешируем новый пароль (как при регистрации)
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // 3. Обновляем в базе данных
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' })
    }

    res.json({ message: 'Пароль успешно изменен администратором' })
  } catch (error) {
    console.error('Error changing password:', error)
    res.status(500).json({ message: 'Ошибка сервера при смене пароля' })
  }
})



router.put('/:id/admin-update', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') return res.status(403).json({ message: 'Нет прав' })

    const { email, role } = req.body
    const userId = req.params.id

    if (email) {
      const checkEmail = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId])
      if (checkEmail.rows.length > 0) {
        return res.status(400).json({ message: 'Этот email уже занят другим сотрудником' })
      }
    }

    await pool.query(
      'UPDATE users SET email = COALESCE($1, email), role = COALESCE($2, role) WHERE id = $3',
      [email, role, userId]
    )

    res.json({ message: 'Данные успешно обновлены' })
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при обновлении данных' })
  }
})

export default router