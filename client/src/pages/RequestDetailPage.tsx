import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import Swal from 'sweetalert2';

const RequestDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState<any>(null);

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const res = await api.get(`/service-requests/${id}`);
                setRequest(res.data);
            } catch (err) {
                console.error("Ошибка при загрузке заявки", err);
            }
        };
        fetchRequest();
    }, [id]);

    const updateStatus = async (newStatus: string) => {
        try {
            await api.put(`/service-requests/${id}/status`, { status: newStatus });
            await Swal.fire({
                title: 'Статус обновлен',
                text: `Заявке присвоен статус: ${newStatus}`,
                icon: 'success',
                confirmButtonColor: '#0057A8'
            });
            navigate('/admin/external-requests');
        } catch (err) {
            Swal.fire('Ошибка', 'Не удалось обновить статус', 'error');
        }
    };

    const getServiceLabel = (type: string) => {
        const labels: any = {
            'solar': 'Солнечная генерация',
            'lighting': 'Наружное освещение',
            'connect': 'Технологическое присоединение',
            'generation': 'Объекты генерации',
            'power-share': 'Перераспределение мощности',
            'construction': 'Строительно-монтажные работы'
        };
        return labels[type] || type;
    };

    if (!request) return (
        <div style={{ background: '#F4F7F9', minHeight: '100vh' }}>
            <Navbar />
            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        </div>
    );

    return (
        <div style={{ background: '#F4F7F9', minHeight: '100vh' }}>
            <Navbar />

            <div className="container py-5">
                <div className="d-flex align-items-center gap-3 mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="btn btn-white shadow-sm border-0"
                        style={{ borderRadius: '10px', padding: '10px 20px' }}
                    >
                        ← Назад
                    </button>
                    <h2 className="fw-bold mb-0">Заявка №{request.id}</h2>
                </div>

                <div className="row g-4">
                    {/* Левая колонка: Основная информация */}
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                            <h5 className="fw-bold border-bottom pb-3 mb-3">Информация о клиенте</h5>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="text-muted small d-block">Тип заявителя</label>
                                    <span className="fw-semibold">{request.customer_type === 'organization' ? '🏢 Юридическое лицо' : '👤 Физическое лицо'}</span>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="text-muted small d-block">ФИО / Название</label>
                                    <span className="fw-semibold">{request.full_name}</span>
                                </div>
                                {request.organization_inn && (
                                    <div className="col-md-6 mb-3">
                                        <label className="text-muted small d-block">ИНН</label>
                                        <span className="fw-semibold text-primary">{request.organization_inn}</span>
                                    </div>
                                )}
                                <div className="col-md-6 mb-3">
                                    <label className="text-muted small d-block">Контактный телефон</label>
                                    <span className="fw-semibold">{request.phone}</span>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="text-muted small d-block">Электронная почта</label>
                                    <span className="fw-semibold">{request.email}</span>
                                </div>
                                <div className="col-md-12">
                                    <label className="text-muted small d-block">Адрес объекта</label>
                                    <span className="fw-semibold">📍 {request.address}</span>
                                </div>
                            </div>
                        </div>

                        <div className="card border-0 shadow-sm rounded-4 p-4">
                            <h5 className="fw-bold border-bottom pb-3 mb-3">Технические параметры и описание</h5>
                            <div className="mb-4">
                                <label className="text-muted small d-block mb-2">Выбранная услуга</label>
                                <span className="badge bg-primary fs-6">{getServiceLabel(request.service_type)}</span>
                            </div>

                            <div className="row g-3">
    {request.technical_params && Object.entries(request.technical_params).map(([key, value]) => (
        value && (
            <div className="col-md-4" key={key}>
                <div className="p-3 rounded-3 border bg-light">
                    <label className="text-muted small d-block text-uppercase">
                        {key === 'power' ? 'Мощность' :
                         key === 'voltage' ? 'Напряжение' :
                         key === 'objectType' ? 'Тип объекта' :
                         key === 'length' ? 'Протяженность' :
                         key === 'workType' ? 'Вид работ' : key}
                    </label>
                    <span className="fw-bold">{String(value)}</span>
                </div>
            </div>
        )
    ))}
</div>

                            <div className="mt-4">
                                <label className="text-muted small d-block">Комментарий к заявке (полное содержание):</label>
                                <div className="p-3 mt-2 rounded-3 border-start border-4 border-primary bg-light" style={{ whiteSpace: 'pre-wrap' }}>
                                    {request.additional_info || 'Комментарий отсутствует'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm rounded-4 p-4 sticky-top" style={{ top: '100px' }}>
                            <h5 className="fw-bold mb-3">Управление статусом</h5>
                            <div className="mb-4">
                                <label className="text-muted small d-block">Текущее состояние:</label>
                                <span className="badge bg-warning text-dark px-3 py-2 mt-1">{request.status}</span>
                            </div>

                            <div className="d-grid gap-2">
                                <button onClick={() => updateStatus('IN_PROGRESS')} className="btn btn-outline-primary fw-bold p-3">Принять в работу</button>
                                <button onClick={() => updateStatus('COMPLETED')} className="btn btn-success fw-bold p-3">Завершить успешно</button>
                                <hr />
                                <button onClick={() => updateStatus('REJECTED')} className="btn btn-danger fw-bold p-3">Отклонить заявку</button>
                            </div>

                            <div className="mt-4 text-muted small">
                                <p className="mb-1">Дата подачи: {new Date(request.created_at).toLocaleString()}</p>
                                <p>ID в базе: {request.id}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestDetailPage;