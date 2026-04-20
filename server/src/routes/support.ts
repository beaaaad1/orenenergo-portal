import { Router, Response } from 'express';
import pool from '../db';
import authMiddleware, { AuthRequest } from '../middleware/auth';

const router = Router();

// --- СТАРЫЙ КОД ТИКЕТОВ (БЕЗ ИЗМЕНЕНИЙ) ---

router.post('/tickets', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { subject } = req.body;
  const userId = req.user!.id;
  try {
    const result = await pool.query(
      'INSERT INTO support_tickets (user_id, subject) VALUES ($1, $2) RETURNING *',
      [userId, subject]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при создании обращения' });
  }
});

router.get('/tickets', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'ADMIN';
  try {
    let result;
    if (isAdmin) {
      result = await pool.query(`
        SELECT t.*, u.name as user_name 
        FROM support_tickets t 
        JOIN users u ON t.user_id = u.id 
        ORDER BY t.created_at DESC
      `);
    } else {
      result = await pool.query(
        'SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при получении списка тикетов' });
  }
});

router.get('/tickets/:id/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
  const ticketId = req.params.id;
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'ADMIN';
  try {
    if (!isAdmin) {
      const ticketCheck = await pool.query(
        'SELECT id FROM support_tickets WHERE id = $1 AND user_id = $2',
        [ticketId, userId]
      );
      if (ticketCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Нет доступа к этому обращению' });
      }
    }
    const result = await pool.query(
      'SELECT * FROM ticket_messages WHERE ticket_id = $1 ORDER BY created_at ASC',
      [ticketId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при загрузке переписки' });
  }
});

router.post('/tickets/:id/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
  const ticketId = req.params.id;
  const userId = req.user!.id;
  const { text } = req.body;
  const isAdmin = req.user!.role === 'ADMIN';
  try {
    const result = await pool.query(
      `INSERT INTO ticket_messages (ticket_id, sender_id, text, is_admin_reply) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [ticketId, userId, text, isAdmin]
    );
    if (isAdmin) {
      await pool.query('UPDATE support_tickets SET status = $1 WHERE id = $2', ['IN_PROGRESS', ticketId]);
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при отправке сообщения' });
  }
});

router.put('/tickets/:id/close', authMiddleware, async (req: AuthRequest, res: Response) => {
  const ticketId = req.params.id;
  try {
    await pool.query("UPDATE support_tickets SET status = 'CLOSED' WHERE id = $1", [ticketId]);
    res.json({ message: 'Тикет закрыт' });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при закрытии' });
  }
});

// --- НОВЫЙ КОД: ЛИЧНЫЕ СООБЩЕНИЯ МЕЖДУ ПОЛЬЗОВАТЕЛЯМИ ---

/**
 * Получить историю сообщений с конкретным пользователем
 * Маршрут: GET /api/support/chats/messages/:targetId
 */
router.get('/chats/messages/:targetId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const myId = req.user!.id;
  const targetId = req.params.targetId;

  try {
    // Выбираем все сообщения, где отправитель или получатель — я или мой собеседник
    const result = await pool.query(
      `SELECT * FROM user_messages 
       WHERE (sender_id = $1 AND receiver_id = $2) 
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [myId, targetId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при загрузке личных сообщений' });
  }
});

/**
 * Отправить личное сообщение пользователю
 * Маршрут: POST /api/support/chats/messages/:targetId
 */
router.post('/chats/messages/:targetId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const senderId = req.user!.id;
  const receiverId = req.params.targetId;
  const { text } = req.body;

  if (!text || text.trim() === '') {
    return res.status(400).json({ message: 'Текст сообщения пуст' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO user_messages (sender_id, receiver_id, text) 
       VALUES ($1, $2, $3) RETURNING *`,
      [senderId, receiverId, text]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при отправке личного сообщения' });
  }
});

export default router;