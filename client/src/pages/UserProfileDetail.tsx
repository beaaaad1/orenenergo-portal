import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext' // Предполагаем наличие контекста для проверки роли

interface UserProfile {
  id: number
  name: string
  email: string
  role: string
  department: string
  phone: string
  avatar_url?: string
  created_at: string
  tasks_completed?: number
  employee_id?: string
  experience?: string
  work_schedule?: string
}

interface UserDocument {
  id: number
  title: string
  filename: string
  filepath: string
  created_at: string
}

const roleLabel = (role: string) => {
  const roles: Record<string, string> = { ADMIN: 'Администратор', MANAGER: 'Руководитель' }
  return roles[role] || 'Сотрудник'
}

const UserProfileDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth() // Получаем данные текущего залогиненного пользователя

  const [user, setUser] = useState<UserProfile | null>(null)
  const [documents, setDocuments] = useState<UserDocument[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Состояния для формы загрузки (только для админа)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [docTitle, setDocTitle] = useState('')

  const fetchData = async () => {
    try {
      const [userRes, docsRes] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/users/${id}/documents`)
      ])
      setUser(userRes.data)
      setDocuments(docsRes.data)
    } catch (err) {
      console.error("Ошибка загрузки:", err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !id) return

    setUploading(true)
    const formData = new FormData()
    formData.append('document', file)
    formData.append('title', docTitle || file.name)

    try {
      await api.post(`/users/${id}/documents`, formData)
      setFile(null)
      setDocTitle('')
      fetchData() // Обновляем список документов
      alert('Документ успешно добавлен сотруднику')
    } catch (err) {
      alert('Ошибка при загрузке документа')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="spinner-border text-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container py-5 text-center">
        <h3 className="fw-bold">Пользователь не найден</h3>
        <button className="btn btn-primary mt-3 px-4" onClick={() => navigate('/users')}>
          Вернуться к списку
        </button>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#F4F7F9', minHeight: '100vh' }}>
      <Navbar />

      <div style={{ height: '220px', background: 'linear-gradient(90deg, #004B91 0%, #0076CE 100%)' }}></div>

      <div className="container" style={{ maxWidth: '950px', marginTop: '-110px', paddingBottom: '50px' }}>
        <div className="card border-0 shadow-sm" style={{ borderRadius: '24px', overflow: 'hidden' }}>
          <div className="card-body p-0">

            <div className="p-4 p-md-5 text-center text-md-start d-md-flex align-items-end gap-4 bg-white">
              <div
                className="rounded-circle shadow d-flex align-items-center justify-content-center text-white fw-bold mx-auto mx-md-0"
                style={{
                  width: '150px', height: '150px', fontSize: '60px',
                  background: user.avatar_url ? `url(${user.avatar_url}) center/cover no-repeat` : 'linear-gradient(135deg, #004B91 0%, #00A1E4 100%)',
                  border: '6px solid #fff',
                  position: 'relative'
                }}
              >
                {!user.avatar_url && user.name.charAt(0)}
              </div>

              <div className="mt-3 mt-md-0 flex-grow-1">
                <h1 className="fw-bold mb-1" style={{ color: '#1A202C' }}>{user.name}</h1>
                <span className="badge px-3 py-2" style={{ backgroundColor: '#EBF8FF', color: '#2B6CB0', borderRadius: '8px', fontSize: '14px' }}>
                  {roleLabel(user.role)}
                </span>
              </div>

              <div className="ms-md-auto mt-4 mt-md-0">
                <button className="btn btn-light border px-4 fw-bold shadow-sm" onClick={() => navigate(-1)} style={{ borderRadius: '12px' }}>
                   ← Назад
                </button>
              </div>
            </div>

            <div className="p-4 p-md-5 bg-white border-top">

              <div className="row g-3 mb-5">
                <div className="col-6 col-md-3">
                  <div className="p-3 text-center border-0 shadow-sm" style={{ backgroundColor: '#EBF4FF', borderRadius: '15px' }}>
                    <div className="small fw-bold text-primary text-uppercase mb-1">Задачи</div>
                    <div className="h4 fw-bold mb-0">{user.tasks_completed || 0}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="p-3 text-center border-0 shadow-sm" style={{ backgroundColor: '#F7FAFC', borderRadius: '15px' }}>
                    <div className="small fw-bold text-muted text-uppercase mb-1">Табельный №</div>
                    <div className="h4 fw-bold mb-0">{user.employee_id || '—'}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="p-3 text-center border-0 shadow-sm" style={{ backgroundColor: '#F7FAFC', borderRadius: '15px' }}>
                    <div className="small fw-bold text-muted text-uppercase mb-1">Стаж</div>
                    <div className="h4 fw-bold mb-0">{user.experience || '—'}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="p-3 text-center border-0 shadow-sm" style={{ backgroundColor: '#F7FAFC', borderRadius: '15px' }}>
                    <div className="small fw-bold text-muted text-uppercase mb-1">График</div>
                    <div className="h4 fw-bold mb-0">{user.work_schedule || '5/2'}</div>
                  </div>
                </div>
              </div>

              <div className="row g-4 mb-5">
                {[
                  { label: 'Электронная почта', val: user.email },
                  { label: 'Подразделение', val: user.department || 'Не указано' },
                  { label: 'Контактный телефон', val: user.phone || '—' },
                  { label: 'Дата регистрации', val: new Date(user.created_at).toLocaleDateString('ru-RU') }
                ].map((item, idx) => (
                  <div key={idx} className="col-md-6">
                    <div className="pb-3 border-bottom">
                      <label className="text-muted small fw-bold text-uppercase mb-1 d-block">{item.label}</label>
                      <div className="fw-bold" style={{ fontSize: '17px' }}>{item.val}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* СЕКЦИЯ ЗАГРУЗКИ (ТОЛЬКО ДЛЯ ADMIN) */}
              {currentUser?.role === 'ADMIN' && (
                <div className="mt-5 p-4 rounded-4 shadow-sm" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <h6 className="fw-bold mb-3 text-primary">➕ Добавить новый документ сотруднику</h6>
                  <form onSubmit={handleUploadDoc} className="row g-3">
                    <div className="col-md-6">
                      <input
                        type="text"
                        className="form-control border-0 shadow-sm"
                        placeholder="Название (например: Трудовой договор)"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="file"
                        className="form-control border-0 shadow-sm"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                    </div>
                    <div className="col-md-2">
                      <button className="btn btn-primary w-100 shadow-sm fw-bold" disabled={uploading || !file}>
                        {uploading ? '...' : 'ОК'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="mt-5">
                <h5 className="fw-bold mb-4">📂 Личные документы</h5>
                {documents.length > 0 ? (
                  <div className="row g-3">
                    {documents.map(doc => (
                      <div key={doc.id} className="col-12">
                        <div className="p-3 border rounded-3 d-flex justify-content-between align-items-center bg-white shadow-sm">
                          <div>
                            <div className="fw-bold">{doc.title}</div>
                            <div className="small text-muted">{new Date(doc.created_at).toLocaleDateString('ru-RU')}</div>
                          </div>
                          <a href={doc.filepath} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary px-3">Открыть</a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 text-center border border-2 border-dashed rounded-4 bg-light">
                    <p className="text-muted mb-0">Список документов пуст</p>
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

export default UserProfileDetail