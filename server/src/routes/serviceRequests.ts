import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
    const {
        service_type,
        customer_type,
        full_name,
        organization_inn,
        phone,
        email,
        address,
        technical_params,
        additional_info
    } = req.body;

    try {
        const newRequest = await pool.query(
            `INSERT INTO service_requests 
            (service_type, customer_type, full_name, organization_inn, phone, email, address, technical_params, additional_info) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [
                service_type,
                customer_type,
                full_name,
                organization_inn || null,
                phone,
                email,
                address,
                JSON.stringify(technical_params),
                additional_info
            ]
        );
        res.status(201).json(newRequest.rows[0]);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).json({ error: 'Ошибка сервера при сохранении заявки' });
    }
});

// Получение списка всех заявок (Для твоей новой страницы)
router.get('/', async (req: Request, res: Response) => {
    try {
        const allRequests = await pool.query(
            'SELECT * FROM service_requests ORDER BY created_at DESC'
        );
        res.json(allRequests.rows);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).json({ error: 'Ошибка сервера при получении списка' });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM service_requests WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Заявка не найдена' });
        }
        res.json(result.rows[0]);
    } catch (err: any) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновление статуса (например, на 'CONVERTED')
router.put('/:id/status', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await pool.query(
            'UPDATE service_requests SET status = $1 WHERE id = $2',
            [status, id]
        );
        res.json({ message: 'Статус успешно обновлен' });
    } catch (err: any) {
        res.status(500).json({ error: 'Ошибка обновления статуса' });
    }
});

export default router;