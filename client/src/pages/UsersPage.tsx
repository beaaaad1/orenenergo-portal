import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

interface User {
  id: number
  name: string
  email: string
  role: string
  department: string
  phone: string
  avatar_url: string | null
}

const roleLabel = (role: string) => {
  if (role === 'ADMIN') return 'Администратор'
  if (role === 'MANAGER') return 'Руководитель'
  return 'Сотрудник'
}

const roleStyle = (role: string) => {
  if (role === 'ADMIN') return { bg: '#FFF5F5', color: '#E53E3E' }
  if (role === 'MANAGER') return { bg: '#FFFBEB', color: '#D69E2E' }
  return { bg: '#F7FAFC', color: '#4A5568' }
}

const UsersPage = () => {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'EMPLOYEE', department: '', phone: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // --- НОВОЕ: Состояния для редактирования администратором ---
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ email: '', role: '' })

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await api.get('/users')
      setUsers(res.data)
    } catch (err) {
      console.error("Ошибка при загрузке списка пользователей")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  // --- НОВОЕ: Обработчик сохранения изменений (Email и Роль) ---
  const handleAdminUpdate = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation() // Чтобы не сработал переход в профиль
    try {
      await api.put(`/users/${id}/admin-update`, editForm)
      setEditingUserId(null)
      setSuccess('Данные сотрудника обновлены')
      setTimeout(() => setSuccess(''), 3000)
      fetchUsers()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка при обновлении данных')
    }
  }

  // --- НОВОЕ: Вход в режим редактирования ---
  const startEditing = (e: React.MouseEvent, u: User) => {
    e.stopPropagation()
    setEditingUserId(u.id)
    setEditForm({ email: u.email, role: u.role })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/users', form)
      setForm({ name: '', email: '', password: '', role: 'EMPLOYEE', department: '', phone: '' })
      setShowForm(false)
      setSuccess('Сотрудник успешно добавлен в систему')
      setTimeout(() => setSuccess(''), 3000)
      fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при сохранении сотрудника')
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (!confirm('Вы уверены, что хотите удалить сотрудника?')) return
    try {
      await api.delete(`/users/${id}`)
      fetchUsers()
    } catch (err) {
      alert("Не удалось удалить пользователя")
    }
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.department && u.department.toLowerCase().includes(search.toLowerCase())) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ backgroundColor: '#F4F7F9', minHeight: '100vh' }}>
      <Navbar />
      <div className="container py-5">

        {/* Заголовок */}
        <div className="d-flex justify-content-between align-items-end mb-4">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: '#1A202C' }}>Справочник сотрудников</h2>
            <p className="text-muted mb-0">Всего в базе: {users.length} чел.</p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-white shadow-sm border-0" onClick={() => navigate('/print?type=users')} style={{ borderRadius: '10px' }}>
              🖨️ Печать
            </button>
            {isAdmin() && (
              <button className="btn text-white shadow-sm" onClick={() => setShowForm(!showForm)} style={{ backgroundColor: '#00A1E4', borderRadius: '10px', fontWeight: '500' }}>
                {showForm ? 'Отмена' : '+ Добавить сотрудника'}
              </button>
            )}
          </div>
        </div>

        {success && (
          <div className="alert border-0 shadow-sm text-white mb-4" style={{ backgroundColor: '#48BB78', borderRadius: '12px' }}>
            {success}
          </div>
        )}

        {/* Форма регистрации */}
        {showForm && isAdmin() && (
          <div className="card border-0 shadow-sm mb-5" style={{ borderRadius: '15px' }}>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">Регистрация нового сотрудника</h5>

              {error && (
                <div className="alert alert-danger border-0 mb-4" style={{ borderRadius: '10px' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row g-4">
                  <div className="col-md-4">
                    <label className="form-label text-muted small fw-bold text-uppercase">ФИО сотрудника</label>
                    <input className="form-control form-control-lg bg-light border-0" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={{ fontSize: '15px' }} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-muted small fw-bold text-uppercase">Email (Логин)</label>
                    <input type="email" className="form-control form-control-lg bg-light border-0" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required style={{ fontSize: '15px' }} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-muted small fw-bold text-uppercase">Пароль</label>
                    <input type="password" className="form-control form-control-lg bg-light border-0" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required style={{ fontSize: '15px' }} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-muted small fw-bold text-uppercase">Подразделение</label>
                    <input className="form-control form-control-lg bg-light border-0" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} style={{ fontSize: '15px' }} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-muted small fw-bold text-uppercase">Роль в системе</label>
                    <select className="form-select form-select-lg bg-light border-0" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ fontSize: '15px' }}>
                      <option value="EMPLOYEE">Сотрудник</option>
                      <option value="MANAGER">Руководитель</option>
                      <option value="ADMIN">Администратор</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-muted small fw-bold text-uppercase">Телефон</label>
                    <input className="form-control form-control-lg bg-light border-0" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ fontSize: '15px' }} />
                  </div>
                  <div className="col-12 mt-4 text-end">
                    <button type="submit" className="btn btn-lg px-5 text-white" style={{ backgroundColor: '#2D3748', borderRadius: '10px', fontSize: '16px' }}>
                      Сохранить данные
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Поиск */}
        <div className="position-relative mb-5">
          <input
            className="form-control form-control-lg border-0 shadow-sm ps-5"
            placeholder="Поиск по имени, отделу или почте..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ borderRadius: '12px', height: '60px', fontSize: '16px' }}
          />
          <span className="position-absolute top-50 translate-middle-y ms-3" style={{ fontSize: '20px', opacity: 0.5 }}>🔍</span>
        </div>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Синхронизация данных...</p>
          </div>
        )}

        {/* Сетка сотрудников */}
        <div className="row g-4">
          {filtered.map(u => {
            const style = roleStyle(u.role)
            const isEditing = editingUserId === u.id // Проверка режима редактирования

            return (
              <div key={u.id} className="col-md-6 col-lg-4">
                <div
                  className="card h-100 border-0 shadow-sm"
                  onClick={() => !isEditing && navigate(`/profile/${u.id}`)}
                  style={{
                    borderRadius: '16px',
                    transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: isEditing ? 'default' : 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (!isEditing) {
                      e.currentTarget.style.transform = 'translateY(-5px)'
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.08)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-3 mb-4">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                        style={{
                          width: '60px', height: '60px',
                          fontSize: '24px', flexShrink: 0,
                          backgroundColor: '#004B91',
                          background: u.avatar_url
                            ? `url(${u.avatar_url}) center/cover no-repeat`
                            : 'linear-gradient(135deg, #004B91 0%, #00A1E4 100%)'
                        }}
                      >
                        {!u.avatar_url && u.name.charAt(0)}
                      </div>
                      <div className="overflow-hidden w-100">
                        <h6 className="mb-1 fw-bold text-truncate" style={{ fontSize: '18px', color: '#2D3748' }}>{u.name}</h6>

                        {/* Редактирование роли (НОВОЕ) */}
                        {isEditing ? (
                          <select
                            className="form-select form-select-sm border-0 bg-light"
                            value={editForm.role}
                            onClick={e => e.stopPropagation()}
                            onChange={e => setEditForm({...editForm, role: e.target.value})}
                            style={{ fontSize: '12px', borderRadius: '6px' }}
                          >
                            <option value="EMPLOYEE">Сотрудник</option>
                            <option value="MANAGER">Руководитель</option>
                            <option value="ADMIN">Администратор</option>
                          </select>
                        ) : (
                          <span
                            style={{
                              backgroundColor: style.bg,
                              color: style.color,
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}
                          >
                            {roleLabel(u.role)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="d-flex align-items-center text-muted mb-2">
                        <span className="me-2" style={{ width: '20px' }}>🏢</span>
                        <span className="small text-truncate">{u.department || 'Подразделение не указано'}</span>
                      </div>

                      {/* Редактирование Email (НОВОЕ) */}
                      <div className="d-flex align-items-center text-muted mb-2">
                        <span className="me-2" style={{ width: '20px' }}>✉️</span>
                        {isEditing ? (
                          <input
                            className="form-control form-control-sm border-0 bg-light"
                            value={editForm.email}
                            onClick={e => e.stopPropagation()}
                            onChange={e => setEditForm({...editForm, email: e.target.value})}
                            style={{ fontSize: '13px' }}
                          />
                        ) : (
                          <span className="small text-truncate">{u.email}</span>
                        )}
                      </div>

                      {!isEditing && u.phone && (
                        <div className="d-flex align-items-center text-muted">
                          <span className="me-2" style={{ width: '20px' }}>📞</span>
                          <span className="small">{u.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Панель управления админа (ОБНОВЛЕНО) */}
                    {isAdmin() && (
                      <div className="d-flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #f1f1f1' }}>
                        {isEditing ? (
                          <>
                            <button
                              className="btn btn-success btn-sm flex-grow-1 fw-bold"
                              onClick={(e) => handleAdminUpdate(e, u.id)}
                              style={{ borderRadius: '8px', fontSize: '12px' }}
                            >
                              Сохранить
                            </button>
                            <button
                              className="btn btn-light btn-sm fw-bold text-muted"
                              onClick={(e) => { e.stopPropagation(); setEditingUserId(null); }}
                              style={{ borderRadius: '8px', fontSize: '12px' }}
                            >
                              Отмена
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn btn-link text-primary btn-sm flex-grow-1 p-0 text-decoration-none fw-bold"
                              onClick={(e) => startEditing(e, u)}
                              style={{ fontSize: '13px' }}
                            >
                              Изменить
                            </button>
                            <button
                              className="btn btn-link text-danger btn-sm p-0 text-decoration-none fw-bold"
                              onClick={(e) => handleDelete(e, u.id)}
                              style={{ fontSize: '13px' }}
                            >
                              Удалить
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && !loading && (
          <div className="text-center mt-5 py-5 border-2 border-dashed rounded-4" style={{ border: '2px dashed #CBD5E0', backgroundColor: '#fff' }}>
            <p className="text-muted mb-0">Сотрудники не найдены по вашему запросу</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UsersPage