import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

interface Vacation {
  id: number
  user_id: number
  user_name: string
  department: string
  start_date: string
  end_date: string
  status: string
  comment: string | null
  type?: string
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
  const [showForm, setShowForm] = useState(false)
  const [isSigned, setIsSigned] = useState(false)
  const [selectedVacation, setSelectedVacation] = useState<Vacation | null>(null)

  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    comment: '',
    type: 'Ежегодный основной оплачиваемый отпуск',
  })

  const fetchVacations = async () => {
    try {
      const res = await api.get('/vacations')
      setVacations(res.data)
    } catch (err) {
      console.error("Ошибка загрузки:", err)
    }
  }

  useEffect(() => { fetchVacations() }, [])

  // Функция для печати
  const handlePrint = () => {
    window.print()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSigned) return alert("Необходимо подтвердить подписание ПЭП")
    try {
        await api.post('/vacations', form)
        setForm({ startDate: '', endDate: '', comment: '', type: 'Ежегодный основной оплачиваемый отпуск' })
        setIsSigned(false)
        setShowForm(false)
        fetchVacations()
    } catch (err) {
        alert("Ошибка при подаче заявки")
    }
  }

  const handleStatus = async (id: number, status: string) => {
    try {
      await api.put(`/vacations/${id}/status`, { status })
      setSelectedVacation(null)
      fetchVacations()
    } catch (err) {
      alert("Ошибка при обновлении статуса")
    }
  }

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  }

  const getApprovedCount = (userId: number) => {
    const currentYear = new Date().getFullYear();
    return vacations.filter(v =>
      v.user_id === userId &&
      v.status === 'APPROVED' &&
      new Date(v.start_date).getFullYear() === currentYear
    ).length;
  }

  return (
    <div style={{ backgroundColor: '#F4F7F9', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Скрываем навигацию при печати */}
      <div className="d-print-none">
        <Navbar />
      </div>

      <div className="container py-5 d-print-none">
        <div className="d-flex justify-content-between align-items-end mb-4">
          <div>
            <h3 className="fw-bold mb-1" style={{ color: '#1A202C' }}>
                {isAdmin() ? 'Управление отпусками' : 'Мои отпуска'}
            </h3>
            <p className="text-muted mb-0 small">Система электронного документооборота</p>
          </div>
          <div className="d-flex gap-2">
            {isAdmin() && (
                <button className="btn btn-white shadow-sm border-0 px-3 btn-sm" onClick={() => navigate('/print?type=vacations')} style={{ borderRadius: '8px' }}>
                    🖨️ Реестр
                </button>
            )}
            <button
              className="btn text-white shadow-sm px-4 btn-sm"
              onClick={() => setShowForm(!showForm)}
              style={{ backgroundColor: showForm ? '#718096' : '#00A1E4', borderRadius: '8px', fontWeight: '500' }}
            >
              {showForm ? 'Отмена' : '+ Создать заявление'}
            </button>
          </div>
        </div>

        {/* Форма подачи */}
        {showForm && (
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '15px' }}>
            <div className="card-body p-4">
              <h6 className="fw-bold mb-4 text-uppercase text-muted" style={{ fontSize: '12px' }}>Заполнение данных</h6>
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-bold">ВИД ОТПУСКА</label>
                    <select className="form-select form-select-sm bg-light border-0" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      <option>Ежегодный основной оплачиваемый отпуск</option>
                      <option>Отпуск без сохранения заработной платы</option>
                      <option>Дополнительный оплачиваемый отпуск</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label text-muted small fw-bold">НАЧАЛО</label>
                    <input type="date" className="form-control form-control-sm bg-light border-0" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label text-muted small fw-bold">КОНЕЦ</label>
                    <input type="date" className="form-control form-control-sm bg-light border-0" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required />
                  </div>
                  <div className="col-12">
                     <textarea className="form-control form-control-sm bg-light border-0" rows={2} value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} placeholder="Примечание..." />
                  </div>
                  <div className="col-12 d-flex justify-content-between align-items-center mt-3">
                    <div className="form-check">
                        <input className="form-check-input" type="checkbox" checked={isSigned} onChange={(e) => setIsSigned(e.target.checked)} id="pepSign" />
                        <label className="form-check-label small text-muted" htmlFor="pepSign">Подписать ПЭП</label>
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm px-4" disabled={!isSigned} style={{ backgroundColor: '#0057A8' }}>Отправить</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Список заявлений */}
        <div className="d-flex flex-column gap-2">
          {vacations.map(v => {
            const style = statusStyle(v.status);
            return (
              <div
                key={v.id}
                className="card border-0 shadow-sm"
                style={{ borderRadius: '12px', cursor: isAdmin() ? 'pointer' : 'default' }}
                onClick={() => isAdmin() && setSelectedVacation(v)}
              >
                <div className="card-body py-3 px-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold small"
                        style={{ width: '36px', height: '36px', background: isAdmin() ? '#4A5568' : '#00A1E4', fontSize: '12px' }}
                      >
                        {v.user_name.charAt(0)}
                      </div>
                      <div>
                        <div className="fw-bold small">{isAdmin() ? v.user_name : 'Мое заявление'}</div>
                        <div className="text-muted" style={{ fontSize: '11px' }}>{v.department}</div>
                      </div>
                    </div>
                    <div className="text-center small d-none d-md-block">
                       <span className="fw-medium">{new Date(v.start_date).toLocaleDateString()} — {new Date(v.end_date).toLocaleDateString()}</span>
                       <span className="text-muted ms-2">({calculateDays(v.start_date, v.end_date)} дн.)</span>
                    </div>
                    <span style={{ backgroundColor: style.bg, color: style.color, border: `1px solid ${style.border}`, fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '6px' }}>
                        {statusLabel(v.status).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* МОДАЛЬНОЕ ОКНО - ОФИЦИАЛЬНЫЙ БЛАНК */}
      {selectedVacation && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center py-0 py-md-4"
               style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 3000, overflowY: 'auto' }}>

              <style>{`
                @media print {
                  body * { visibility: hidden; }
                  .print-container, .print-container * { visibility: visible; }
                  .print-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; box-shadow: none !important; }
                  .d-print-none { display: none !important; }
                }
              `}</style>

              <div className="bg-white shadow-lg p-4 p-md-5 print-container"
                   style={{ width: '100%', maxWidth: '750px', height: 'fit-content', minHeight: '850px', borderRadius: '2px', color: '#000' }}>

                  {/* Панель управления (скрывается при печати) */}
                  <div className="d-flex justify-content-between mb-4 d-print-none align-items-center">
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-primary px-3" onClick={handlePrint}>🖨️ Печать</button>
                        <div className="badge bg-light text-dark border p-2 fw-normal" style={{ fontSize: '12px' }}>
                            📊 Одобрено в 2026г: <strong>{getApprovedCount(selectedVacation.user_id)}</strong>
                        </div>
                      </div>
                      <button className="btn btn-sm btn-outline-secondary border-0" onClick={() => setSelectedVacation(null)}>✕ Закрыть</button>
                  </div>

                  {/* ШАПКА */}
                  <div className="row mb-5" style={{ fontSize: '13px', lineHeight: '1.2' }}>
                      <div className="col-6"></div>
                      <div className="col-6 ps-5">
                          <p className="mb-0">Директору филиала ПАО «Россети Волга» -</p>
                          <p className="fw-bold mb-0">«Оренбургэнерго»</p>
                          <p className="mb-3">Кажаеву В.Ф.</p>
                          <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>от сотрудника:</p>
                          <p className="fw-bold mb-0">{selectedVacation.user_name}</p>
                          <p className="mb-0">{selectedVacation.department}</p>
                      </div>
                  </div>

                  {/* ЗАГОЛОВОК */}
                  <div className="text-center my-5">
                      <h6 className="fw-bold" style={{ letterSpacing: '1px' }}>ЗАЯВЛЕНИЕ</h6>
                  </div>

                  {/* ТЕКСТ */}
                  <div className="mb-5 px-4" style={{ fontSize: '14px', textAlign: 'justify', lineHeight: '1.8' }}>
                      <p>
                          Прошу предоставить мне <strong>{selectedVacation.type || 'Ежегодный основной оплачиваемый отпуск'}</strong> сроком
                          на <strong>{calculateDays(selectedVacation.start_date, selectedVacation.end_date)}</strong> календарных дней
                          с <strong>{new Date(selectedVacation.start_date).toLocaleDateString('ru-RU')}</strong> по <strong>{new Date(selectedVacation.end_date).toLocaleDateString('ru-RU')}</strong>.
                      </p>
                      {selectedVacation.comment && (
                          <div className="mt-4 p-2 bg-light rounded border-start border-4 d-print-none">
                              <small className="text-muted d-block" style={{ fontSize: '10px' }}>КОММЕНТАРИЙ:</small>
                              <span style={{ fontSize: '13px' }}>{selectedVacation.comment}</span>
                          </div>
                      )}
                  </div>

                  {/* ПОДПИСИ */}
                  <div className="mt-5 pt-5 d-flex justify-content-between align-items-end px-4" style={{ fontSize: '13px' }}>
                      <div>
                          <p className="mb-1">Дата подачи: {new Date().toLocaleDateString('ru-RU')}</p>
                          <p className="mb-0">Подпись: __________________</p>
                      </div>
                      <div className="text-center p-2" style={{ border: '1.5px solid #0057A8', color: '#0057A8', borderRadius: '2px', maxWidth: '220px' }}>
                          <div className="fw-bold" style={{ fontSize: '11px' }}>ДОКУМЕНТ ПОДПИСАН ЭП</div>
                          <hr className="my-1" style={{ opacity: 0.2 }} />
                          <div style={{ fontSize: '9px' }}>Сертификат: {selectedVacation.user_id}-{selectedVacation.id}</div>
                          <div style={{ fontSize: '9px' }}>Владелец: {selectedVacation.user_name}</div>
                      </div>
                  </div>

                  {/* КНОПКИ ДЕЙСТВИЯ (скрываются при печати) */}
                  <div className="mt-auto pt-5 d-flex gap-2 justify-content-center d-print-none">
                      {selectedVacation.status === 'PENDING' ? (
                          <>
                              <button className="btn btn-outline-danger btn-sm px-4" onClick={() => handleStatus(selectedVacation.id, 'REJECTED')}>Отклонить</button>
                              <button
                                  className="btn btn-primary btn-sm px-4"
                                  disabled={getApprovedCount(selectedVacation.user_id) >= 2}
                                  onClick={() => handleStatus(selectedVacation.id, 'APPROVED')}
                                  style={{ backgroundColor: '#0057A8' }}
                              >
                                  {getApprovedCount(selectedVacation.user_id) >= 2 ? 'Лимит превышен' : 'Одобрить'}
                              </button>
                          </>
                      ) : (
                          <div className={`p-2 border text-center rounded fw-bold small w-100 ${selectedVacation.status === 'APPROVED' ? 'text-success border-success' : 'text-danger border-danger'}`}>
                              РЕШЕНИЕ ПРИНЯТО: {statusLabel(selectedVacation.status).toUpperCase()}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  )
}

export default VacationsPage