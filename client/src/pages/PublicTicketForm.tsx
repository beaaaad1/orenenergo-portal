import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import homeIcon from '../assets/logo.svg';
import api from '../api/axios';
import Swal from 'sweetalert2';

const PublicTicketForm = () => {
    const { type } = useParams();
    const navigate = useNavigate();

    const [isOrganization, setIsOrganization] = useState(false);

    const getTitle = () => {
        const titles: Record<string, string> = {
            'solar': 'Заявка на установку солнечных панелей',
            'lighting': 'Заявка на наружное освещение',
            'connect': 'Технологическое присоединение',
            'generation': 'Подключение объектов генерации',
            'power-share': 'Перераспределение мощности',
            'construction': 'Строительно-монтажные работы'
        };
        return titles[type || ''] || 'Новое обращение';
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const requestData = {
            service_type: type,
            customer_type: isOrganization ? 'organization' : 'individual',
            full_name: formData.get('fullName'),
            organization_inn: isOrganization ? formData.get('inn') : null,
            phone: formData.get('phone'),
            email: formData.get('email'),
            address: formData.get('address'),
            additional_info: formData.get('info'),
            technical_params: {
                power: formData.get('power'),
                voltage: formData.get('voltage'),
                object_type: formData.get('objectType'),
                length: formData.get('length'),
                work_type: formData.get('workType')
            }
        };

        try {
            await api.post('/service-requests', requestData);

            await Swal.fire({
                title: 'Заявка принята!',
                text: 'В ближайшее время с вами свяжется оператор или диспетчер для подтверждения заявки.',
                icon: 'success',
                confirmButtonText: 'Хорошо',
                confirmButtonColor: '#0057A8',
            });

            navigate('/');
        } catch (error) {
            console.error(error);

            Swal.fire({
                title: 'Ошибка',
                text: 'Не удалось отправить заявку. Попробуйте позже или свяжитесь с поддержкой.',
                icon: 'error',
                confirmButtonColor: '#d33'
            });
        }
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '8px',
        fontWeight: 600,
        color: '#1A2B3C',
        fontSize: '14px',
        marginTop: '20px'
    };

    const inputStyle = {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #D8E2EC',
        fontSize: '15px',
        outline: 'none',
        background: '#F9FBFF'
    };

    return (
        <div style={{ background: '#F0F4F8', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: '#0057A8', padding: '10px 140px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/"><img src={homeIcon} width="180" height="60" alt="Logo" style={{ objectFit: 'contain' }} /></Link>
                <button
                    onClick={() => navigate(`/login`)}
                    style={{ background: '#fff', border: 'none', color: '#0057A8', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                >
                    Вход для персонала
                </button>
            </div>

            <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', padding: '40px 20px' }}>
                <div style={{ background: '#fff', width: '100%', maxWidth: '800px', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

                    <div style={{ padding: '30px 40px', background: '#0057A8', color: '#fff' }}>
                        <h2 style={{ margin: 0, fontSize: '24px' }}>{getTitle()}</h2>
                    </div>

                    <form style={{ padding: '40px' }} onSubmit={handleSubmit}>

                        <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input type="radio" name="customerType" checked={!isOrganization} onChange={() => setIsOrganization(false)} />
                                Физическое лицо
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input type="radio" name="customerType" checked={isOrganization} onChange={() => setIsOrganization(true)} />
                                Организация
                            </label>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={labelStyle}>{isOrganization ? 'Название организации' : 'ФИО заявителя'}</label>
                                <input name="fullName" type="text" placeholder={isOrganization ? 'ООО "Вектор"' : 'Иванов Иван Иванович'} style={inputStyle} required />
                            </div>
                            {isOrganization && (
                                <div>
                                    <label style={labelStyle}>ИНН организации</label>
                                    <input name="inn" type="text" placeholder="10 цифр" style={inputStyle} required />
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={labelStyle}>Контактный телефон</label>
                                <input name="phone" type="tel" style={inputStyle} required />
                            </div>
                            <div>
                                <label style={labelStyle}>Электронная почта</label>
                                <input name="email" type="email" style={inputStyle} required />
                            </div>
                        </div>

                        {type === 'solar' && (
                            <div style={{ background: '#F0F7FF', padding: '20px', borderRadius: '10px', marginTop: '20px' }}>
                                <label style={{...labelStyle, marginTop: 0}}>Тип объекта для установки панелей</label>
                                <select name="objectType" style={inputStyle}>
                                    <option>Частный дом</option>
                                    <option>Промышленное здание</option>
                                    <option>Земельный участок</option>
                                </select>
                            </div>
                        )}

                        {type === 'lighting' && (
                            <div style={{ background: '#F0F7FF', padding: '20px', borderRadius: '10px', marginTop: '20px' }}>
                                <label style={{...labelStyle, marginTop: 0}}>Протяженность участка освещения (метры)</label>
                                <input name="length" type="number" placeholder="например, 500" style={inputStyle} />
                            </div>
                        )}

                        {(type === 'connect' || type === 'generation') && (
                            <div style={{ background: '#F0F7FF', padding: '20px', borderRadius: '10px', marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{...labelStyle, marginTop: 0}}>Запрашиваемая мощность (кВт)</label>
                                    <input name="power" type="number" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{...labelStyle, marginTop: 0}}>Класс напряжения</label>
                                    <select name="voltage" style={inputStyle}>
                                        <option>0.4 кВ</option>
                                        <option>6 кВ</option>
                                        <option>10 кВ</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {type === 'construction' && (
                            <div style={{ background: '#F0F7FF', padding: '20px', borderRadius: '10px', marginTop: '20px' }}>
                                <label style={{...labelStyle, marginTop: 0}}>Вид работ</label>
                                <select name="workType" style={inputStyle}>
                                    <option>Строительство ЛЭП</option>
                                    <option>Монтаж подстанции (ТП)</option>
                                    <option>Земляные работы</option>
                                    <option>Ремонтные работы</option>
                                </select>
                            </div>
                        )}

                        <label style={labelStyle}>Адрес объекта</label>
                        <input name="address" type="text" style={inputStyle} required />

                        <label style={labelStyle}>Дополнительная информация</label>
                        <textarea name="info" style={{ ...inputStyle, height: '100px', resize: 'none' }}></textarea>

                        <div style={{ marginTop: '25px', padding: '20px', border: '2px dashed #D8E2EC', borderRadius: '10px', textAlign: 'center' }}>
                            <p style={{ margin: 0, color: '#64748B', fontSize: '13px' }}>Прикрепить документы (необязательно): план участка, паспорт, свидетельство</p>
                            <input type="file" multiple style={{ marginTop: '10px' }} />
                        </div>

                        <div style={{ display: 'flex', gap: '16px', marginTop: '30px' }}>
                            <button
                                type="submit"
                                style={{
                                    flex: 2,
                                    background: '#F5A623',
                                    color: '#412402',
                                    border: 'none',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    fontSize: '18px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                ОТПРАВИТЬ ЗАЯВКУ
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate(`/service/${type}`)}
                                style={{
                                    flex: 1,
                                    background: '#fff',
                                    color: '#64748B',
                                    border: '1px solid #D8E2EC',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Назад к описанию
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PublicTicketForm;