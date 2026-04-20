import React, { useEffect, useState, useRef } from 'react'
import Navbar from '../components/Navbar'
import api from '../api/axios'

interface UserDocument {
    id: number
    title: string
    filepath: string
    created_at: string
}

interface Profile {
    id: number
    name: string
    email: string
    role: string
    department: string
    phone: string
    avatar_url?: string
    created_at: string
    // Новые поля
    employee_id?: string
    work_schedule?: string
    experience?: string
    tasks_completed?: number
}

const roleLabel = (role: string) => {
    const roles: Record<string, string> = { ADMIN: 'Администратор', MANAGER: 'Руководитель' }
    return roles[role] || 'Сотрудник'
}

const ProfilePage = () => {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [documents, setDocuments] = useState<UserDocument[]>([])
    const [editing, setEditing] = useState(false)
    const [success, setSuccess] = useState(false)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Состояние формы со всеми полями
    const [form, setForm] = useState({
        name: '',
        phone: '',
        department: '',
        employee_id: '',
        work_schedule: '',
        experience: ''
    })

    const fetchData = async () => {
        try {
            const userRes = await api.get('/users/me')
            const data = userRes.data
            setProfile(data)

            // Заполняем форму данными из БД
            setForm({
                name: data.name || '',
                phone: data.phone || '',
                department: data.department || '',
                employee_id: data.employee_id || '',
                work_schedule: data.work_schedule || '',
                experience: data.experience || ''
            })

            // Загрузка документов
            const docsRes = await api.get(`/users/${data.id}/documents`)
            setDocuments(docsRes.data)
        } catch (err) {
            console.error("Ошибка загрузки данных профиля")
        }
    }

    useEffect(() => { fetchData() }, [])

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const formData = new FormData()
            formData.append('avatar', e.target.files[0])
            setUploading(true)
            try {
                await api.post('/users/upload-avatar', formData)
                await fetchData()
            } catch (err) {
                alert("Ошибка при загрузке фото")
            } finally {
                setUploading(false)
            }
        }
    }

    const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const res = await api.put('/users/me', form);
        // Сразу обновляем стейт профиля тем, что вернула база данных
        setProfile(res.data);
        setEditing(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
        alert("Ошибка при сохранении");
    }
};

    const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0] && profile) {
            const fd = new FormData()
            fd.append('document', e.target.files[0])
            fd.append('title', e.target.files[0].name)
            try {
                await api.post(`/users/${profile.id}/documents`, fd)
                await fetchData()
            } catch (err) {
                alert("Ошибка при загрузке документа")
            }
        }
    }

    if (!profile) return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center">
            <div className="spinner-border text-primary"></div>
        </div>
    )

    return (
        <div style={{ backgroundColor: '#f4f7f9', minHeight: '100vh' }}>
            <Navbar />

            {/* Фон шапки */}
            <div style={{ height: '200px', background: 'linear-gradient(135deg, #004A99 0%, #0066CC 100%)' }}></div>

            <div className="container" style={{ maxWidth: '900px', marginTop: '-100px', paddingBottom: '50px' }}>
                <div className="card border-0 shadow-lg" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                    <div className="card-body p-0">

                        {/* Верхняя часть: Аватар и Имя */}
                        <div className="p-4 p-md-5 text-center text-md-start d-md-flex align-items-center gap-4 border-bottom bg-white">
                            <div className="position-relative d-inline-block">
                                <div className="rounded-circle shadow-sm d-flex align-items-center justify-content-center text-white fw-bold"
                                    style={{
                                        width: '140px', height: '140px', fontSize: '56px',
                                        background: profile.avatar_url ? `url(${profile.avatar_url}) center/cover no-repeat` : 'linear-gradient(135deg, #0057A8 0%, #003366 100%)',
                                        border: '6px solid #fff', opacity: uploading ? 0.6 : 1
                                    }}>
                                    {!profile.avatar_url && profile.name.charAt(0)}
                                </div>
                                <button className="btn btn-light shadow-sm rounded-circle position-absolute bottom-0 end-0 p-2" onClick={() => fileInputRef.current?.click()}>📸</button>
                                <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} hidden accept="image/*" />
                            </div>
                            <div className="mt-3 flex-grow-1">
                                <h2 className="fw-bold mb-1 text-dark">{profile.name}</h2>
                                <div className="d-flex flex-wrap gap-2 justify-content-center justify-content-md-start align-items-center">
                                    <span className="badge bg-primary px-3 py-2" style={{ borderRadius: '10px' }}>{roleLabel(profile.role)}</span>
                                    <span className="text-muted small">ID: {profile.id}</span>
                                </div>
                            </div>
                            <div className="mt-4 mt-md-0">
                                {!editing && (
                                    <button className="btn btn-primary px-4 fw-bold rounded-pill" onClick={() => setEditing(true)}>
                                        Редактировать профиль
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Основной контент */}
                        <div className="p-4 p-md-5 bg-white">
                            {success && <div className="alert alert-success rounded-4 border-0 shadow-sm mb-4">Данные успешно сохранены!</div>}

                            {!editing ? (
                                <>
                                    {/* Статистика в виде карточек */}
                                    <div className="row g-3 mb-5 text-center">
                                        <div className="col-6 col-md-3">
                                            <div className="p-3 rounded-4" style={{ backgroundColor: '#eef6ff' }}>
                                                <div className="text-primary small fw-bold text-uppercase mb-1">Задачи</div>
                                                <div className="h4 fw-bold text-dark mb-0">{profile.tasks_completed || 0}</div>
                                            </div>
                                        </div>
                                        <div className="col-6 col-md-3">
                                            <div className="p-3 rounded-4 bg-light">
                                                <div className="text-muted small fw-bold text-uppercase mb-1">Табельный №</div>
                                                <div className="h4 fw-bold text-dark mb-0">{profile.employee_id || '—'}</div>
                                            </div>
                                        </div>
                                        <div className="col-6 col-md-3">
                                            <div className="p-3 rounded-4 bg-light">
                                                <div className="text-muted small fw-bold text-uppercase mb-1">Стаж</div>
                                                <div className="h4 fw-bold text-dark mb-0">{profile.experience || '—'}</div>
                                            </div>
                                        </div>
                                        <div className="col-6 col-md-3">
                                            <div className="p-3 rounded-4 bg-light">
                                                <div className="text-muted small fw-bold text-uppercase mb-1">График</div>
                                                <div className="h5 fw-bold text-dark mb-0">{profile.work_schedule || '5/2'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Детальная информация */}
                                    <div className="row g-4">
                                        <div className="col-md-6 border-bottom pb-3">
                                            <label className="text-muted small fw-bold text-uppercase d-block mb-1">Электронная почта</label>
                                            <div className="fw-bold">{profile.email}</div>
                                        </div>
                                        <div className="col-md-6 border-bottom pb-3">
                                            <label className="text-muted small fw-bold text-uppercase d-block mb-1">Подразделение</label>
                                            <div className="fw-bold">{profile.department || 'Не указано'}</div>
                                        </div>
                                        <div className="col-md-6 border-bottom pb-3">
                                            <label className="text-muted small fw-bold text-uppercase d-block mb-1">Контактный телефон</label>
                                            <div className="fw-bold">{profile.phone || '—'}</div>
                                        </div>
                                        <div className="col-md-6 border-bottom pb-3">
                                            <label className="text-muted small fw-bold text-uppercase d-block mb-1">Дата регистрации</label>
                                            <div className="fw-bold">{new Date(profile.created_at).toLocaleDateString('ru-RU')}</div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <form onSubmit={handleSave} className="row g-3">
                                    <div className="col-12">
                                        <label className="form-label fw-bold small text-muted">ФИО СОТРУДНИКА</label>
                                        <input className="form-control form-control-lg rounded-3" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold small text-muted">ПОДРАЗДЕЛЕНИЕ / ОТДЕЛ</label>
                                        <input className="form-control rounded-3" value={form.department} onChange={e => setForm({...form, department: e.target.value})} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold small text-muted">ТЕЛЕФОН</label>
                                        <input className="form-control rounded-3" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold small text-muted">ТАБЕЛЬНЫЙ НОМЕР</label>
                                        <input className="form-control rounded-3" value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold small text-muted">ГРАФИК РАБОТЫ</label>
                                        <input className="form-control rounded-3" value={form.work_schedule} onChange={e => setForm({...form, work_schedule: e.target.value})} placeholder="напр. 5/2" />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold small text-muted">СТАЖ</label>
                                        <input className="form-control rounded-3" value={form.experience} onChange={e => setForm({...form, experience: e.target.value})} />
                                    </div>
                                    <div className="col-12 d-flex gap-2 mt-4">
                                        <button type="submit" className="btn btn-primary px-5 rounded-pill fw-bold">Сохранить</button>
                                        <button type="button" className="btn btn-light px-4 rounded-pill" onClick={() => setEditing(false)}>Отмена</button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Секция Личных Документов */}
                        <div className="p-4 p-md-5 bg-light border-top">
                            <div className="d-flex align-items-center justify-content-between mb-4">
                                <h4 className="fw-bold m-0" style={{ color: '#004A99' }}>📂 Личные документы</h4>
                                {profile.role === 'ADMIN' && (
                                    <label className="btn btn-sm btn-outline-primary px-3 rounded-pill fw-bold shadow-sm bg-white">
                                        + Загрузить новый документ
                                        <input type="file" hidden onChange={handleDocUpload} />
                                    </label>
                                )}
                            </div>

                            <div className="row g-3">
                                {documents.length > 0 ? (
                                    documents.map(doc => (
                                        <div key={doc.id} className="col-12">
                                            <div className="d-flex align-items-center p-3 bg-white rounded-4 shadow-sm border-start border-5 border-primary">
                                                <div className="me-3" style={{ fontSize: '24px' }}>📄</div>
                                                <div className="flex-grow-1">
                                                    <div className="fw-bold text-dark mb-0" style={{ fontSize: '15px' }}>{doc.title}</div>
                                                    <div className="text-muted" style={{ fontSize: '12px' }}>
                                                        Загружен: {new Date(doc.created_at).toLocaleDateString('ru-RU')}
                                                    </div>
                                                </div>
                                                <a href={doc.filepath} target="_blank" rel="noreferrer" className="btn btn-link text-primary text-decoration-none fw-bold">
                                                    Скачать
                                                </a>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-5 text-muted border rounded-4 bg-white">
                                        Здесь будут храниться ваши приказы и трудовой договор.
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProfilePage