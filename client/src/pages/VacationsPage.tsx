import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

interface Vacation {
  id: number
  user_name: string
  department: string
  start_date: string
  end_date: string
  status: string
  comment: string | null
}

const statusLabel = (s: string) => {
  if (s === 'PENDING') return 'На рассмотрении'
  if (s === 'APPROVED') return 'Одобрен'
  return 'Отклонён'
}

const statusStyle = (s: string) => {
  if (s === 'APPROVED') return { bg: '#F0FFF4', color: '#2F855A', border: '#C6F6D5' }
  if (s === 'REJECTED') return { bg: '#FFF5F5', color: '#C53030', border: '#FED7D7' }
  return { bg: '#FFFBEB', color: '#B7791F', border: '#FEEBC8' }
}

const VacationsPage = () => {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [vacations, setVacations] = useState<Vacation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    comment: '',
  })

  const fetchVacations = async () => {
    try {
      const res = await api.get('/vacations')
      setVacations(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchVacations() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.post('/vacations', form)
    setForm({ startDate: '', endDate: '', comment: '' })
    setShowForm(false)
    fetchVacations()
  }

  const handleStatus = async (id: number, status: string) => {
    await api.put(`/vacations/${id}/status`, { status })
    fetchVacations()
  }

  // Расчет количества дней
  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  }

  return (
    <div style={{ backgroundColor: '#F4F7F9', minHeight: '100vh' }}>
      <Navbar />

      {/* Контейнер с правильными отступами */}
      <div className="container py-5">

        {/* Заголовок */}
        <div className="d-flex justify-content-between align-items-end mb-5">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: '#1A202C' }}>График отпусков</h2>
            <p className="text-muted mb-0">Учет и планирование отдыха сотрудников</p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-white shadow-sm border-0 px-3" onClick={() => navigate('/print?type=vacations')} style={{ borderRadius: '10px' }}>
              🖨️ Печать
            </button>
            <button
              className="btn text-white shadow-sm px-4"
              onClick={() => setShowForm(!showForm)}
              style={{ backgroundColor: '#00A1E4', borderRadius: '10px', fontWeight: '500' }}
            >
              {showForm ? 'Отмена' : '+ Подать заявку'}
            </button>
          </div>
        </div>

        {/* Форма заявки */}
        {showForm && (
          <div className="card border-0 shadow-sm mb-5" style={{ borderRadius: '15px' }}>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">Оформление заявления на отпуск</h5>
              <form onSubmit={handleSubmit}>
                <div className="row g-4">
                  <div className="col-md-4">
                    <label className="form-label text-muted small fw-bold">ДАТА НАЧАЛА</label>
                    <input type="date" className="form-control bg-light border-0" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-muted small fw-bold">ДАТА ОКОНЧАНИЯ</label>
                    <input type="date" className="form-control bg-light border-0" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required />
                  </div>
                  <div className="col-md-4 d-flex align-items-end">
                    {form.startDate && form.endDate && (
                       <div className="w-100 p-2 text-center rounded bg-primary-subtle text-primary fw-bold mb-1" style={{ fontSize: '14px' }}>
                         Итого: {calculateDays(form.startDate, form.endDate)} дн.
                       </div>
                    )}
                  </div>
                  <div className="col-12">
                    <label className="form-label text-muted small fw-bold">ПРИМЕЧАНИЕ (НЕОБЯЗАТЕЛЬНО)</label>
                    <textarea className="form-control bg-light border-0" rows={2} value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} placeholder="Укажите причину или доп. информацию..." />
                  </div>
                  <div className="col-12 text-end">
                    <button type="submit" className="btn btn-dark px-5" style={{ borderRadius: '10px' }}>Отправить на согласование</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading && <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}

        {/* Список заявок */}
        <div className="d-flex flex-column gap-3">
          {vacations.map(v => {
            const style = statusStyle(v.status);
            const days = calculateDays(v.start_date, v.end_date);

            return (
              <div
                key={v.id}
                className="card border-0 shadow-sm"
                style={{ borderRadius: '16px', transition: '0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                        style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #2D3748 0%, #4A5568 100%)' }}
                      >
                        {v.user_name.charAt(0)}
                      </div>
                      <div>
                        <h6 className="fw-bold mb-0" style={{ color: '#2D3748' }}>{v.user_name}</h6>
                        <span className="text-muted small">{v.department}</span>
                      </div>
                    </div>

                    <div className="text-center px-4 border-start border-end">
                      <div className="small text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '10px' }}>Период</div>
                      <div className="fw-bold" style={{ fontSize: '14px' }}>
                        {new Date(v.start_date).toLocaleDateString('ru-RU')} — {new Date(v.end_date).toLocaleDateString('ru-RU')}
                      </div>
                      <div className="badge bg-light text-dark border mt-1">{days} дней</div>
                    </div>

                    <div className="d-flex flex-column align-items-end gap-3">
                      <span
                        style={{
                          backgroundColor: style.bg, color: style.color, border: `1px solid ${style.border}`,
                          fontSize: '12px', fontWeight: '700', padding: '6px 14px', borderRadius: '10px'
                        }}
                      >
                        {statusLabel(v.status)}
                      </span>

                      {isAdmin() && v.status === 'PENDING' && (
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm text-success fw-bold p-0 px-2"
                            onClick={() => handleStatus(v.id, 'APPROVED')}
                            style={{ fontSize: '13px' }}
                          >
                            Одобрить
                          </button>
                          <div className="vr"></div>
                          <button
                            className="btn btn-sm text-danger fw-bold p-0 px-2"
                            onClick={() => handleStatus(v.id, 'REJECTED')}
                            style={{ fontSize: '13px' }}
                          >
                            Отклонить
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {v.comment && (
                    <div className="mt-3 p-2 bg-light rounded" style={{ fontSize: '13px', borderLeft: '3px solid #CBD5E0' }}>
                      <span className="me-2">💬</span> {v.comment}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {vacations.length === 0 && !loading && (
            <div className="text-center py-5 bg-white rounded-4 shadow-sm">
              <p className="text-muted mb-0">Активных заявок на отпуск не обнаружено</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VacationsPage