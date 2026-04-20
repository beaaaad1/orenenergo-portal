import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

interface Event {
  id: number
  title: string
  description: string | null
  date: string
  created_at: string
}

const EventsPage = () => {
  const { isAdmin } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', date: '',
  })
  const [success, setSuccess] = useState('')

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events')
      setEvents(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEvents() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.post('/events', form)
    setForm({ title: '', description: '', date: '' })
    setShowForm(false)
    setSuccess('Событие успешно запланировано')
    setTimeout(() => setSuccess(''), 3000)
    fetchEvents()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить это мероприятие?')) return
    await api.delete(`/events/${id}`)
    fetchEvents()
  }

  const upcoming = events.filter(e => new Date(e.date) >= new Date())
  const past = events.filter(e => new Date(e.date) < new Date())

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
    })
  }

  const getDay = (date: string) => new Date(date).getDate()
  const getMonth = (date: string) => new Date(date).toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '')

  const getDaysLeftLabel = (date: string) => {
    const diff = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return { label: 'Сегодня', color: '#E53E3E' }
    if (diff === 1) return { label: 'Завтра', color: '#DD6B20' }
    return { label: `Через ${diff} дн.`, color: '#3182CE' }
  }

  return (
    <div style={{ backgroundColor: '#F4F7F9', minHeight: '100vh' }}>
      <Navbar />
      <div className="container py-5">

        {/* Шапка */}
        <div className="d-flex justify-content-between align-items-end mb-5">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: '#1A202C' }}>Мероприятия</h2>
            <p className="text-muted mb-0">Корпоративные события, совещания и праздники</p>
          </div>
          {isAdmin() && (
            <button
              className="btn text-white shadow-sm px-4"
              onClick={() => setShowForm(!showForm)}
              style={{ backgroundColor: '#00A1E4', borderRadius: '10px', fontWeight: '500' }}
            >
              {showForm ? 'Отмена' : '+ Создать событие'}
            </button>
          )}
        </div>

        {success && <div className="alert border-0 shadow-sm text-white mb-4" style={{ backgroundColor: '#48BB78' }}>{success}</div>}

        {/* Форма */}
        {showForm && isAdmin() && (
          <div className="card border-0 shadow-sm mb-5" style={{ borderRadius: '15px' }}>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">Планирование мероприятия</h5>
              <form onSubmit={handleSubmit}>
                <div className="row g-4">
                  <div className="col-md-7">
                    <label className="form-label text-muted small fw-bold">НАЗВАНИЕ</label>
                    <input className="form-control bg-light border-0" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label text-muted small fw-bold">ДАТА И ВРЕМЯ</label>
                    <input type="datetime-local" className="form-control bg-light border-0" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label text-muted small fw-bold">ОПИСАНИЕ И МЕСТО ПРОВЕДЕНИЯ</label>
                    <textarea className="form-control bg-light border-0" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="col-12 text-end">
                    <button type="submit" className="btn btn-dark px-5" style={{ borderRadius: '10px' }}>Добавить в календарь</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading && <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}

        {/* Предстоящие */}
        <div className="d-flex align-items-center gap-3 mb-4">
          <h5 className="fw-bold mb-0">Предстоящие</h5>
          <div className="flex-grow-1 bg-light" style={{ height: '2px' }}></div>
        </div>

        <div className="row g-4 mb-5">
          {upcoming.map(event => {
            const status = getDaysLeftLabel(event.date);
            return (
              <div key={event.id} className="col-md-6 col-lg-4">
                <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                  <div className="card-body p-0 d-flex">
                    {/* Календарная плашка */}
                    <div className="text-center d-flex flex-column justify-content-center" style={{ width: '80px', backgroundColor: '#EDF2F7', borderRight: '1px solid #E2E8F0' }}>
                      <div className="fw-bold text-primary" style={{ fontSize: '24px', lineHeight: '1' }}>{getDay(event.date)}</div>
                      <div className="text-uppercase small fw-bold text-muted">{getMonth(event.date)}</div>
                    </div>

                    <div className="p-3 flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                          <span style={{fontSize: '11px', fontWeight: '800', color: status.color, textTransform: 'uppercase'}}>
                            ● {status.label}
                          </span>
                          {isAdmin() && (
                              <button
                                  onClick={() => handleDelete(event.id)}
                                  className="btn btn-link text-danger text-decoration-none p-0"
                                  style={{fontSize: '13px', fontWeight: '600'}}
                              >
                                  Удалить
                              </button>
                          )}
                      </div>
                      <h6 className="fw-bold mb-2" style={{ color: '#2D3748' }}>{event.title}</h6>
                      <p className="text-muted small mb-0">{event.description}</p>
                      <div className="mt-3 pt-2 border-top">
                        <small className="fw-bold text-primary">🕒 {formatDate(event.date).split(',')[1] || formatDate(event.date)}</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          {upcoming.length === 0 && !loading && <p className="text-muted ps-3">Нет запланированных событий</p>}
        </div>

        {/* Прошедшие */}
        {past.length > 0 && (
          <>
            <div className="d-flex align-items-center gap-3 mb-4 opacity-50">
              <h5 className="fw-bold mb-0">Завершенные</h5>
              <div className="flex-grow-1 bg-light" style={{ height: '2px' }}></div>
            </div>
            <div className="row g-4">
              {past.map(event => (
                <div key={event.id} className="col-md-6 col-lg-4">
                  <div className="card h-100 border-0 shadow-sm opacity-75" style={{ borderRadius: '16px', backgroundColor: '#F8FAFC' }}>
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between mb-2">
                        <span className="badge bg-light text-muted border">Архив</span>
                        {isAdmin() && (
                          <button onClick={() => handleDelete(event.id)} className="btn btn-link text-danger p-0">🗑️</button>
                        )}
                      </div>
                      <h6 className="fw-bold mb-1 text-muted">{event.title}</h6>
                      <small className="text-muted d-block mb-2">📅 {formatDate(event.date)}</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default EventsPage