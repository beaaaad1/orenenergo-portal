import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

interface Task {
  id: number
  title: string
  description: string
  status: string
  priority: string
  author_name: string
  assignee_name: string | null
  deadline: string | null
  created_at: string
}

interface User {
  id: number
  name: string
}

const statusLabel = (s: string) => {
  if (s === 'NEW') return 'Новые'
  if (s === 'IN_PROGRESS') return 'В работе'
  if (s === 'REVIEW') return 'На проверке'
  if (s === 'DONE') return 'Завершены'
  return s
}

const priorityStyle = (p: string) => {
  if (p === 'HIGH') return { color: '#E53E3E', bg: '#FFF5F5', label: 'Высокий' }
  if (p === 'MEDIUM') return { color: '#D69E2E', bg: '#FFFBEB', label: 'Средний' }
  return { color: '#718096', bg: '#F7FAFC', label: 'Низкий' }
}

const STATUSES = ['NEW', 'IN_PROGRESS', 'REVIEW', 'DONE']

const TasksPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', priority: 'MEDIUM', assigneeId: '', deadline: '',
  })

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks')
      setTasks(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
    api.get('/users').then(res => setUsers(res.data))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.post('/tasks', {
      ...form,
      assigneeId: form.assigneeId ? Number(form.assigneeId) : null,
      deadline: form.deadline || null,
    })
    setForm({ title: '', description: '', priority: 'MEDIUM', assigneeId: '', deadline: '' })
    setShowForm(false)
    fetchTasks()
  }

  const handleStatus = async (id: number, status: string) => {
    await api.put(`/tasks/${id}/status`, { status })
    fetchTasks()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить задачу безвозвратно?')) return
    await api.delete(`/tasks/${id}`)
    fetchTasks()
  }

  const columns = STATUSES.map(status => ({
    status,
    tasks: tasks.filter(t => t.status === status)
  }))

  return (
    <div style={{ backgroundColor: '#F4F7F9', minHeight: '100vh' }}>
      <Navbar />
      <div className="container py-5">

        {/* Заголовок */}
        <div className="d-flex justify-content-between align-items-end mb-5">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: '#1A202C' }}>Управление задачами</h2>
            <p className="text-muted mb-0">Канбан-доска подразделения</p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-white shadow-sm border-0 px-3" onClick={() => navigate('/print?type=tasks')} style={{ borderRadius: '10px' }}>
              🖨️ Отчет
            </button>
            <button
              className="btn text-white shadow-sm px-4"
              onClick={() => setShowForm(!showForm)}
              style={{ backgroundColor: '#00A1E4', borderRadius: '10px', fontWeight: '500' }}
            >
              {showForm ? 'Отмена' : '+ Создать задачу'}
            </button>
          </div>
        </div>

        {/* Форма создания */}
        {showForm && (
          <div className="card border-0 shadow-sm mb-5" style={{ borderRadius: '15px' }}>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">Детали новой задачи</h5>
              <form onSubmit={handleSubmit}>
                <div className="row g-4">
                  <div className="col-md-8">
                    <label className="form-label text-muted small fw-bold">НАЗВАНИЕ ЗАДАЧИ</label>
                    <input className="form-control bg-light border-0" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-muted small fw-bold">ОТВЕТСТВЕННЫЙ</label>
                    <select className="form-select bg-light border-0" value={form.assigneeId} onChange={e => setForm({ ...form, assigneeId: e.target.value })}>
                      <option value="">Не назначен</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label text-muted small fw-bold">ТЕХНИЧЕСКОЕ ЗАДАНИЕ / ОПИСАНИЕ</label>
                    <textarea className="form-control bg-light border-0" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-bold">ПРИОРИТЕТ</label>
                    <select className="form-select bg-light border-0" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                      <option value="LOW">Низкий</option>
                      <option value="MEDIUM">Средний</option>
                      <option value="HIGH">Высокий</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-bold">КРАЙНИЙ СРОК (DEADLINE)</label>
                    <input type="date" className="form-control bg-light border-0" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                  </div>
                  <div className="col-12 text-end">
                    <button type="submit" className="btn btn-dark px-5" style={{ borderRadius: '10px' }}>Поставить задачу</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading && <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}

        {/* Канбан-сетка */}
        <div className="row g-4" style={{ minHeight: '70vh' }}>
          {columns.map(col => (
            <div key={col.status} className="col-md-3">
              <div
                className="p-3 rounded-4 h-100 shadow-sm"
                style={{ backgroundColor: '#EDF2F7', border: '1px solid #E2E8F0' }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3 px-2">
                  <h6 className="fw-bold mb-0 text-uppercase small tracking-wider text-muted">
                    {statusLabel(col.status)}
                  </h6>
                  <span className="badge rounded-pill bg-white text-dark shadow-sm px-3">{col.tasks.length}</span>
                </div>

                <div className="d-flex flex-column gap-3">
                  {col.tasks.map(task => {
                    const p = priorityStyle(task.priority)
                    return (
                      <div
                        key={task.id}
                        className="card border-0 shadow-sm"
                        style={{ borderRadius: '12px', transition: '0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <div className="card-body p-3">
                          <div className="mb-2">
                            <span
                              style={{
                                fontSize: '10px', fontWeight: '800',
                                padding: '3px 8px', borderRadius: '6px',
                                backgroundColor: p.bg, color: p.color
                              }}
                            >
                              {p.label}
                            </span>
                          </div>

                          <h6 className="fw-bold mb-2" style={{ color: '#2D3748', lineHeight: '1.4' }}>{task.title}</h6>

                          {task.description && (
                            <p className="text-muted mb-3 small" style={{ fontSize: '12px' }}>
                              {task.description.length > 80 ? task.description.substring(0, 80) + '...' : task.description}
                            </p>
                          )}

                          <div className="pt-3 mt-2 border-top d-flex flex-column gap-2">
                            {task.assignee_name && (
                              <div className="small text-muted d-flex align-items-center">
                                <span className="me-2">👤</span> {task.assignee_name}
                              </div>
                            )}
                            {task.deadline && (
                              <div
                                className="small d-flex align-items-center"
                                style={{ color: new Date(task.deadline) < new Date() ? '#E53E3E' : '#718096' }}
                              >
                                <span className="me-2">📅</span>
                                {new Date(task.deadline).toLocaleDateString('ru-RU')}
                              </div>
                            )}
                          </div>

                          {/* Кнопки действий */}
                          <div className="mt-3 d-flex flex-wrap gap-1">
                            {STATUSES.filter(s => s !== task.status).map(s => (
                              <button
                                key={s}
                                className="btn btn-light border-0 text-muted"
                                style={{ fontSize: '10px', fontWeight: '600' }}
                                onClick={() => handleStatus(task.id, s)}
                              >
                                {statusLabel(s)} →
                              </button>
                            ))}
                            {user?.role === 'ADMIN' && (
                              <button
                                className="btn btn-link text-danger text-decoration-none ms-auto p-0"
                                style={{ fontSize: '11px', fontWeight: '600' }}
                                onClick={() => handleDelete(task.id)}
                              >
                                Удалить
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TasksPage