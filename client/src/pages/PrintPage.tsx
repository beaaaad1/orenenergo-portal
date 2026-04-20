import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import homeIconBlue from '../assets/Group.svg'

// --- Интерфейсы данных ---
interface News {
  id: number
  title: string
  content: string
  category: string
  urgent: boolean
  pinned: boolean
  author_name: string
  created_at: string
}

interface User {
  id: number
  name: string
  email: string
  role: string
  department: string
  phone: string
  created_at: string
}

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

interface Vacation {
  id: number
  user_name: string
  department: string
  start_date: string
  end_date: string
  status: string
  comment: string | null
}

// --- Хелперы для меток ---
const roleLabel = (r: string) => {
  const roles: Record<string, string> = { ADMIN: 'Администратор', MANAGER: 'Руководитель' }
  return roles[r] || 'Сотрудник'
}

const statusLabel = (s: string) => {
  const statuses: Record<string, string> = {
    NEW: 'Новая', IN_PROGRESS: 'В работе', REVIEW: 'На проверке', DONE: 'Готово'
  }
  return statuses[s] || s
}

const vacStatusLabel = (s: string) => {
  const statuses: Record<string, string> = { PENDING: 'На рассмотрении', APPROVED: 'Одобрен' }
  return statuses[s] || 'Отклонён'
}

const categoryLabel = (c: string) => {
  const cats: Record<string, string> = { general: 'Общее', order: 'Приказ', event: 'Событие' }
  return cats[c] || c
}

const PrintPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const type = searchParams.get('type') || 'news'

  const [news, setNews] = useState<News[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [vacations, setVacations] = useState<Vacation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/${type}`)
      if (type === 'news') setNews(res.data)
      else if (type === 'users') setUsers(res.data)
      else if (type === 'tasks') setTasks(res.data)
      else if (type === 'vacations') setVacations(res.data)
    } catch (err) {
      console.error("Ошибка при получении данных для печати:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [type])

  const handlePrint = () => window.print()

  const today = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const titles: Record<string, string> = {
    news: 'ОТЧЕТ ПО НОВОСТЯМ И ОБЪЯВЛЕНИЯМ',
    users: 'СПРАВОЧНИК СОТРУДНИКОВ ПРЕДПРИЯТИЯ',
    tasks: 'РЕЕСТР ТЕКУЩИХ ЗАДАЧ ПОДРАЗДЕЛЕНИЯ',
    vacations: 'ГРАФИК ЕЖЕГОДНЫХ ОТПУСКОВ',
  }

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; background: #fff; }
            .print-container { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
            table { font-size: 11px !important; border-color: #000 !important; }
            .table-light { background-color: #f8f9fa !important; -webkit-print-color-adjust: exact; }
          }
        `}
      </style>

      <div className="container print-container py-5" style={{ maxWidth: '1000px' }}>

        {/* Панель управления (скрыта при печати) */}
        <div className="no-print d-flex align-items-center justify-content-between mb-5 p-3 bg-light rounded-3 shadow-sm border">
          <div className="d-flex gap-2">
            <button className="btn btn-dark" onClick={() => navigate(-1)}>← Назад</button>
            <button className="btn btn-primary" onClick={handlePrint} style={{ backgroundColor: '#0057A8' }}>
              🖨️ Распечатать отчет
            </button>
          </div>
          <div className="d-flex gap-1 align-items-center">
            {['news', 'users', 'tasks', 'vacations'].map(t => (
              <button
                key={t}
                className={`btn btn-sm ${type === t ? 'btn-primary' : 'btn-outline-secondary'}`}
                style={type === t ? { backgroundColor: '#0057A8' } : {}}
                onClick={() => navigate(`/print?type=${t}`)}
              >
                {t === 'news' ? 'Новости' : t === 'users' ? 'Сотрудники' : t === 'tasks' ? 'Задачи' : 'Отпуска'}
              </button>
            ))}
          </div>
        </div>

        {/* Официальный бланк */}
        <div className="d-flex justify-content-between align-items-start mb-4 border-bottom pb-4">
          <div className="d-flex align-items-center gap-3">
            <img
    src={homeIconBlue}
    alt="Россети"
    style={{
        height: '60px',
        /* Эта комбинация фильтров делает логотип глубокого синего цвета */
        filter: 'invert(16%) sepia(89%) saturate(6058%) hue-rotate(205deg) brightness(85%) contrast(110%)'
    }}
  />
            <div>
              <h5 className="fw-bold mb-0">РОССЕТИ ВОЛГА</h5>
              <p className="small mb-0">Филиал ПАО "Россети Волга" — "Оренбургэнерго"</p>
              <p className="text-muted" style={{ fontSize: '10px' }}>460000, г. Оренбург, ул. Маршала Жукова, 28</p>
            </div>
          </div>
          <div className="text-end">
            <div className="badge border text-dark p-2 mb-1" style={{ fontSize: '11px' }}>КОРПОРАТИВНЫЙ ОТЧЕТ</div>
            <p className="small text-muted mb-0">Экземпляр №1</p>
          </div>
        </div>

        {/* Заголовок */}
        <div className="text-center my-5">
          <h3 className="fw-bold text-uppercase" style={{ letterSpacing: '1px' }}>{titles[type]}</h3>
          <p className="text-muted">Дата формирования: {today}</p>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary"></div>
            <p className="mt-2 text-muted">Генерация данных...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered border-dark">
              <thead className="table-light text-uppercase" style={{ fontSize: '10px' }}>
                {type === 'news' && (
                  <tr>
                    <th className="text-center">№</th>
                    <th>Заголовок</th>
                    <th>Категория</th>
                    <th>Автор</th>
                    <th className="text-center">Дата</th>
                  </tr>
                )}
                {type === 'users' && (
                  <tr>
                    <th className="text-center">№</th>
                    <th>ФИО</th>
                    <th>E-mail</th>
                    <th>Отдел</th>
                    <th>Телефон</th>
                    <th>Роль</th>
                  </tr>
                )}
                {type === 'tasks' && (
                  <tr>
                    <th className="text-center">№</th>
                    <th>Задача</th>
                    <th>Статус</th>
                    <th>Приор.</th>
                    <th>Исполнитель</th>
                    <th className="text-center">Дедлайн</th>
                  </tr>
                )}
                {type === 'vacations' && (
                  <tr>
                    <th className="text-center">№</th>
                    <th>Сотрудник</th>
                    <th>Подразделение</th>
                    <th className="text-center">Начало</th>
                    <th className="text-center">Конец</th>
                    <th>Статус</th>
                  </tr>
                )}
              </thead>
              <tbody style={{ fontSize: '12px' }}>
                {type === 'news' && news.map((n, i) => (
                  <tr key={n.id}>
                    <td className="text-center">{i + 1}</td>
                    <td className="fw-bold">{n.title}</td>
                    <td>{categoryLabel(n.category)}</td>
                    <td>{n.author_name}</td>
                    <td className="text-center">{new Date(n.created_at).toLocaleDateString('ru-RU')}</td>
                  </tr>
                ))}
                {type === 'users' && users.map((u, i) => (
                  <tr key={u.id}>
                    <td className="text-center">{i + 1}</td>
                    <td className="fw-bold">{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.department || '—'}</td>
                    <td>{u.phone || '—'}</td>
                    <td>{roleLabel(u.role)}</td>
                  </tr>
                ))}
                {type === 'tasks' && tasks.map((t, i) => (
                  <tr key={t.id}>
                    <td className="text-center">{i + 1}</td>
                    <td className="fw-bold">{t.title}</td>
                    <td>{statusLabel(t.status)}</td>
                    <td>{t.priority}</td>
                    <td>{t.assignee_name || '—'}</td>
                    <td className="text-center">{t.deadline ? new Date(t.deadline).toLocaleDateString('ru-RU') : '—'}</td>
                  </tr>
                ))}
                {type === 'vacations' && vacations.map((v, i) => (
                  <tr key={v.id}>
                    <td className="text-center">{i + 1}</td>
                    <td className="fw-bold">{v.user_name}</td>
                    <td>{v.department || '—'}</td>
                    <td className="text-center">{new Date(v.start_date).toLocaleDateString('ru-RU')}</td>
                    <td className="text-center">{new Date(v.end_date).toLocaleDateString('ru-RU')}</td>
                    <td>{vacStatusLabel(v.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Футер документа */}
        <div className="mt-5 pt-5">
          <div className="row">
            <div className="col-8">
              <p className="mb-4">Ответственное лицо: ________________________________ / ________________</p>
              <p className="small text-muted">Контроль исполнения и достоверности данных подтверждаю.</p>
            </div>
            <div className="col-4 text-end">
              <div className="d-inline-block border border-dark p-4 text-center" style={{ minWidth: '120px', fontSize: '10px' }}>
                М.П.<br />(Место печати)
              </div>
              <p className="mt-2 small">Дата: {new Date().toLocaleDateString('ru-RU')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrintPage