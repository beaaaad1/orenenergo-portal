import { Router, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import pool from '../db'
import authMiddleware, { AuthRequest } from '../middleware/auth'

const router = Router()

// Автоматическое создание папки для загрузок, если её нет
const uploadDir = 'uploads/'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
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
    const allowed = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.png', '.jpg', '.html']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Недопустимый тип файла'))
    }
  }
})

// [GET] Получить все документы (Базовый путь: /api/documents)
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

// [POST] Загрузить документ (Базовый путь: /api/documents)
// ВАЖНО: именно этот роут обрабатывает отправку документов с фронтенда
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
  } catch (err) {
    console.error('Ошибка БД при сохранении документа:', err)
    res.status(500).json({ message: 'Ошибка сервера при записи в БД' })
  }
})

// [GET] Скачать документ
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

// [DELETE] Удалить документ
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

router.post('/generate-generation', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, category, department, metaData } = req.body
    const currentUserId = req.user!.id

    if (!title || !category) {
      res.status(400).json({ message: 'Название и категория документа обязательны' })
      return
    }

    // Проверяем валидность категории для распределения (Договоры / Заявления)
    const validCategories = ['contract', 'order', 'general']
    const finalCategory = validCategories.includes(category) ? category : 'general'

    const prefix = finalCategory === 'contract' ? 'contract' : 'order'
    const uniqueFilename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e5)}.html`
    const fullPathToFile = path.join(uploadDir, uniqueFilename)

    // Формируем структурированный лог для АСУ РОССЕТИ ВОЛГА
    const logData = `=== АСУ РОССЕТИ ВОЛГА ===\n` +
                    `ТИП ДОКУМЕНТА: ${finalCategory === 'contract' ? 'Официальный Договор подряда ТП' : 'Производственный наряд-допуск'}\n` +
                    `Категория распределения: ${finalCategory}\n` +
                    `Подразделение: ${department || 'Служба высоковольтных сетей и генерации'}\n` +
                    `--------------------------------------------------\n` +
                    `ДАННЫЕ СПЕЦИФИКАЦИИ ОБЪЕКТА (JSON):\n` +
                    JSON.stringify(metaData, null, 2)

    fs.writeFileSync(fullPathToFile, logData, 'utf-8')

    // Вставка записи в базу данных
    const query = `
      INSERT INTO documents (title, filename, filepath, category, department, user_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `
    const values = [
      title,
      uniqueFilename,
      uniqueFilename,
      finalCategory,
      department || 'Служба высоковольтных сетей и генерации',
      currentUserId
    ]

    const result = await pool.query(query, values)

    res.status(201).json({
      message: 'Документ успешно зарегистрирован и распределен в АСУ',
      document: result.rows[0]
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Внутренняя ошибка сервера при генерации документа' })
  }
})

// --- Остальные стандартные эндпоинты системы (CRUD) ---
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT d.*, u.name as uploaded_by_name 
      FROM documents d
      JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC
    `)
    res.json(result.rows)
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

router.get('/download/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM documents WHERE id = $1', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ message: 'Документ не найден' })
    const doc = result.rows[0]
    const filepath = path.join(__dirname, '../../uploads', doc.filepath)
    if (!fs.existsSync(filepath)) return res.status(404).json({ message: 'Файл не найден' })
    res.download(filepath, doc.filename)
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN' && req.user!.role !== 'MANAGER') {
      return res.status(403).json({ message: 'Нет прав' })
    }
    await pool.query('DELETE FROM documents WHERE id = $1', [req.params.id])
    res.json({ message: 'Успешно удалено' })
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// [POST] Загрузка файла через форму (Базовый путь: /api/documents/upload)
// Добавляем явный эндпоинт /upload, который ищет фронтенд в PowerShareServicePage
router.post('/upload', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'Файл не загружен' })
      return
    }

    const { title, category, department } = req.body

    const result = await pool.query(`
      INSERT INTO documents (title, filename, filepath, category, department, user_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `, [
      title || req.file.originalname,
      req.file.originalname,
      req.file.filename,
      category || 'general',
      department || 'Служба технологического присоединения',
      req.user!.id
    ])

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Ошибка БД при сохранении документа через /upload:', err)
    res.status(500).json({ message: 'Ошибка сервера при записи в БД' })
  }
})

// Оставляем и старый корневой POST для обратной совместимости с другими страницами,
// если они шлют запросы просто на /api/documents
router.post('/', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'Файл не загружен' })
      return
    }

    const { title, category, department } = req.body

    const result = await pool.query(`
      INSERT INTO documents (title, filename, filepath, category, department, user_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
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
  } catch (err) {
    console.error('Ошибка БД при сохранении документа:', err)
    res.status(500).json({ message: 'Ошибка сервера при записи в БД' })
  }
})

router.post('/construction/approve', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      contractNumber,
      address,
      workScope,
      powerRequested,
      voltageLevel,
      cableLength,
      materialsCost,
      constructionCost,
      docType,
      isOrganization,
      recipientFinalName
    } = req.body

    const currentUserId = req.user!.id

    // Записываем детальный аудит-лог СМР операции в таблицу логов АСУ
    const query = `
      INSERT INTO service_logs (user_id, service_type, doc_type, contract_number, details, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `
    const details = JSON.stringify({
      customer: { name: recipientFinalName, type: isOrganization ? 'Юр.Лицо' : 'Физ.Лицо' },
      object: { address, scope: workScope },
      technical: { power: powerRequested, voltage: voltageLevel, length: cableLength },
      finance: { materials: materialsCost, construction: constructionCost, total: Number(materialsCost || 0) + Number(constructionCost || 0) }
    })

    const result = await pool.query(query, [currentUserId, 'CONSTRUCTION', docType, contractNumber || 'Б/Н', details])

    res.status(200).json({
      message: 'Параметры сметы и договора СМР успешно сохранены в БД',
      log: result.rows[0]
    })
  } catch (error) {
    console.error('Ошибка бэкенда при проведении СМР:', error)
    res.status(500).json({ message: 'Внутренняя ошибка сервера при фиксации СМР договора.' })
  }
})





export default router