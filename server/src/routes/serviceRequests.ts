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

// Получение списка всех заявок
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


// POST /api/service-requests/:servicePath/approve
// 1. Создание или обновление утвержденного договора из любой технологической карты
// POST /api/service-requests/:servicePath/approve
router.post('/:servicePath/approve', async (req: Request, res: Response) => {
    // Явно приводим к строке, чтобы убрать тип string[]
    const servicePath = String(req.params.servicePath);
    const data = req.body;

    try {
        // Парсим финансовые и технические поля из калькуляторов фронтенда
        const feeAdmin = parseFloat(data.adminFee || 0);
        const feeTech = parseFloat(data.inspectionCost || data.installationCost || 0);
        const matCost = parseFloat(data.materialsCost || 0);
        const total = feeAdmin + feeTech + matCost;

        const mainClient = data.clientName || data.donorName || "Потребитель филиала";
        const mainPower = parseFloat(data.powerRequested || data.reallocatedPower || 0);

        // Безопасно вызываем .toUpperCase() от гарантированной строки
        const contractNum = data.contractNumber || `РОССЕТИ-${servicePath.toUpperCase()}-${Date.now().toString().slice(-4)}`;

        // Объединяем все кастомные специфичные поля страниц в единый JSONB блок
        const metaDataJson = JSON.stringify({
            workScope: data.workScope || null,
            cadastralNumber: data.cadastralNumber || null,
            docType: data.docType || null,
            recipientName: data.recipientName || null,
            recipientInn: data.recipientInn || null,
            cableLength: data.cableLength || null
        });

        // UPSERT запрос: если договор с таким номером уже есть — обновляем его, если нет — создаем новый
        const query = `
            INSERT INTO grid_contracts 
            (contract_number, service_type, status, client_name, client_inn, address, power_requested, substation_name, voltage_level, admin_fee, technical_cost, total_cost, meta_data)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (contract_number) 
            DO UPDATE SET 
                status = EXCLUDED.status,
                total_cost = EXCLUDED.total_cost,
                meta_data = EXCLUDED.meta_data,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;

        const result = await pool.query(query, [
            contractNum,
            servicePath.toUpperCase(), // Теперь компилятор на 100% уверен, что это строка
            'APPROVED',
            mainClient,
            data.donorInn || data.innData || null,
            data.address || 'Не указан',
            mainPower,
            data.substationName || 'ЦРП Оренбургэнерго',
            data.voltageLevel || '10 кВ',
            feeAdmin,
            feeTech,
            total,
            metaDataJson
        ]);

        res.status(200).json({ success: true, contract: result.rows[0] });
    } catch (err: any) {
        console.error('Ошибка бэкенда при одобрении техкарты:', err.message);
        res.status(500).json({ error: 'Ошибка сервера при проведении технологической карты' });
    }
});

// GET /api/service-requests/contracts-panel
router.get('/contracts-panel', async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            'SELECT * FROM grid_contracts ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (err: any) {
        console.error('Ошибка бэкенда при получении панели договоров:', err.message);
        res.status(500).json({ error: 'Ошибка сервера при получении списка договоров' });
    }
});

export default router;