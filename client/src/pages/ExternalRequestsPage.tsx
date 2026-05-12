import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';

interface ServiceRequest {
    id: number;
    service_type: string;
    customer_type: string;
    full_name: string;
    organization_inn?: string;
    phone: string;
    email: string;
    address: string;
    technical_params: any;
    additional_info: string;
    status: string;
    created_at: string;
}

const ExternalRequestsPage = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/service-requests');
            setRequests(res.data);
        } catch (error) {
            console.error("Ошибка при загрузке заявок", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleConvertToTask = async (e: React.MouseEvent, req: ServiceRequest) => {
        e.stopPropagation(); // Чтобы не срабатывал переход на страницу деталей при клике на кнопку
        try {
            const fullDescription = `
Тип клиента: ${req.customer_type === 'organization' ? 'Организация (ИНН: ' + req.organization_inn + ')' : 'Физ. лицо'}
Адрес: ${req.address}
Контакты: ${req.phone}, ${req.email}
Детали: ${req.additional_info}
            `.trim();

            await api.post('/tasks', {
                title: `Заявка: ${req.full_name} (${req.service_type})`,
                description: fullDescription,
                priority: 'MEDIUM',
                assigneeId: null,
                deadline: null
            });

            await api.put(`/service-requests/${req.id}/status`, { status: 'CONVERTED' });

            alert('Заявка успешно перенесена в задачи!');
            fetchRequests();
        } catch (error) {
            alert('Не удалось создать задачу');
        }
    };

    const getServiceLabel = (type: string) => {
        const labels: any = {
            'solar': 'Солнечная генерация',
            'lighting': 'Освещение',
            'connect': 'Присоединение',
            'generation': 'Объекты генерации',
            'power-share': 'Перераспределение',
            'construction': 'СМР'
        };
        return labels[type] || type;
    };

    return (
        <div style={{ backgroundColor: '#F4F7F9', minHeight: '100vh' }}>
            <Navbar />
            <div className="container py-5">
                <div className="d-flex align-items-center gap-3 mb-5">
                    <button
                        className="btn btn-light shadow-sm"
                        onClick={() => navigate('/tasks')}
                        style={{ borderRadius: '10px' }}
                    >
                        ← К доске
                    </button>
                    <div>
                        <h2 className="fw-bold mb-1" style={{ color: '#1A202C' }}>Входящие заявки</h2>
                        <p className="text-muted mb-0">Нажмите на карточку для детального просмотра и управления статусом</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-5 bg-white rounded-4 shadow-sm">
                        <p className="text-muted mb-0">Новых заявок пока нет</p>
                    </div>
                ) : (
                    <div className="row g-4">
                        {requests.map(req => (
                            <div key={req.id} className="col-12">
                                <div
                                    className="card border-0 shadow-sm rounded-4 overflow-hidden request-card"
                                    style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                                    onClick={() => navigate(`/admin/requests/${req.id}`)}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
                                    }}
                                >
                                    <div className="card-body p-4">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div className="d-flex gap-3">
                                                <div className="bg-primary text-white rounded-3 d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px', fontSize: '24px' }}>
                                                    {req.service_type === 'solar' ? '☀️' : '⚡'}
                                                </div>
                                                <div>
                                                    <h5 className="fw-bold mb-1">{req.full_name}</h5>
                                                    <div className="d-flex gap-2 align-items-center mb-2">
                                                        <span className="badge bg-light text-primary border">
                                                            {getServiceLabel(req.service_type)}
                                                        </span>
                                                        <span className={`badge ${req.status === 'NEW' ? 'bg-info' : 'bg-secondary'}`}>
                                                            {req.status}
                                                        </span>
                                                    </div>
                                                    <div className="small text-muted">
                                                        <span className="me-3">📞 {req.phone}</span>
                                                        <span>📍 {req.address}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                className="btn btn-warning fw-bold px-4 text-dark"
                                                style={{ borderRadius: '10px' }}
                                                onClick={(e) => handleConvertToTask(e, req)}
                                            >
                                                Создать задачу +
                                            </button>
                                        </div>
                                        <hr className="my-3 text-faded" />
                                        <div className="bg-light p-3 rounded-3">
                                            <p className="small mb-0 text-dark">
                                                <strong>Краткое инфо:</strong> {req.additional_info ? (req.additional_info.substring(0, 100) + '...') : 'Нет комментария'}
                                            </p>
                                        </div>
                                        <div className="mt-3 d-flex justify-content-between align-items-center">
                                            <span className="text-primary small fw-bold">Нажмите, чтобы открыть детали →</span>
                                            <span className="text-muted small">
                                                Поступило: {new Date(req.created_at).toLocaleString('ru-RU')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExternalRequestsPage;