import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface News {
  id: number
  title: string
  category: string
  urgent: boolean
  created_at: string
  author_name: string
  content?: string
  image_url?: string
}

interface Task {
  id: number
  title: string
  status: string
  priority: string
}

interface Stats {
  tasksByStatus: { status: string; count: string }[]
  tasksByPriority: { priority: string; count: string }[]
  newsByMonth: { month: string; count: string }[]
  usersByRole: { role: string; count: string }[]
}

const statusLabel = (s: string) => {
  if (s === 'NEW') return 'Новые'
  if (s === 'IN_PROGRESS') return 'В работе'
  if (s === 'REVIEW') return 'На проверке'
  if (s === 'DONE') return 'Готово'
  return s
}

const priorityLabel = (p: string) => {
  if (p === 'HIGH') return 'Высокий'
  if (p === 'MEDIUM') return 'Средний'
  return 'Низкий'
}

const taskStatusBadge = (s: string) => {
  if (s === 'DONE') return { bg: '#EAF3DE', color: '#3B6D11' }
  if (s === 'IN_PROGRESS') return { bg: '#E8F0FB', color: '#185FA5' }
  if (s === 'REVIEW') return { bg: '#FEF4E3', color: '#854F0B' }
  return { bg: '#F0F4F8', color: '#445566' }
}

const DashboardPage = () => {
  const { user } = useAuth()
  const [news, setNews] = useState<News[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalVacations, setTotalVacations] = useState(0)

  useEffect(() => {
    api.get('/news').then(res => setNews(res.data.slice(0, 4)))
    api.get('/tasks/my').then(res => setTasks(res.data.slice(0, 4)))
    api.get('/stats').then(res => setStats(res.data))
    api.get('/users').then(res => setTotalUsers(res.data.length))
    api.get('/vacations').then(res => setTotalVacations(res.data.length))
  }, [])

  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const latestNews = news[0];

  const taskStatusChart = {
    labels: stats?.tasksByStatus.map(t => statusLabel(t.status)) || [],
    datasets: [{
      data: stats?.tasksByStatus.map(t => Number(t.count)) || [],
      backgroundColor: ['#8A9BB0', '#0057A8', '#F5A623', '#2E7D32'],
      borderWidth: 0,
    }]
  }

  const taskPriorityChart = {
    labels: stats?.tasksByPriority.map(t => priorityLabel(t.priority)) || [],
    datasets: [{
      data: stats?.tasksByPriority.map(t => Number(t.count)) || [],
      backgroundColor: ['#8A9BB0', '#F5A623', '#C0392B'],
      borderWidth: 0,
    }]
  }

  const usersByRoleChart = {
    labels: stats?.usersByRole.map(u => u.role) || [],
    datasets: [{
      data: stats?.usersByRole.map(u => Number(u.count)) || [],
      backgroundColor: ['#C0392B', '#F5A623', '#8A9BB0'],
      borderWidth: 0,
    }]
  }

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: 'bottom' as const, labels: { font: { size: 12 } } } },
  }

  return (
    <>
      <Navbar />
      <div style={{ background: '#F0F4F8', minHeight: '100vh', padding: '14px 8px', margin: '0 100px'}}>

        {/* Приветственная панель */}
        <div style={{
          background: '#0057A8',
          borderRadius: 12,
          padding: '20px 28px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h4 style={{ color: '#fff', fontWeight: 500, marginBottom: 4 }}>
              Добро пожаловать, {user?.name}!
            </h4>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: 0 }}>
              {user?.department} · {today}
            </p>
          </div>
          <span style={{
            background: '#F5A623',
            color: '#412402',
            padding: '6px 16px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 500
          }}>
            ⚡ {user?.role}
          </span>
        </div>

        {/* Виджеты статистики */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Новостей', value: news.length, color: '#0057A8', accent: '#0057A8', link: '/news' },
            { label: 'Активных задач', value: tasks.filter(t => t.status !== 'DONE').length, color: '#854F0B', accent: '#F5A623', link: '/tasks' },
            { label: 'Сотрудников', value: totalUsers, color: '#2E7D32', accent: '#2E7D32', link: '/users' },
            { label: 'Заявок на отпуск', value: totalVacations, color: '#445566', accent: '#8A9BB0', link: '/vacations' },
          ].map((item, i) => (
            <Link key={i} to={item.link} style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#fff',
                borderRadius: 10,
                padding: '18px 20px',
                borderLeft: `4px solid ${item.accent}`,
                border: `1px solid #D8E2EC`,
                borderLeftWidth: 4,
                transition: 'box-shadow 0.2s',
              }}>
                <div style={{ fontSize: 12, color: '#6B7A8D', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 32, fontWeight: 500, color: item.color }}>
                  {item.value}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Графики */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #D8E2EC', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #D8E2EC', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 3, height: 16, background: '#0057A8', borderRadius: 2 }}></div>
                <span style={{ fontWeight: 500, fontSize: 14 }}>Задачи по статусам</span>
              </div>
              <div style={{ padding: 16, display: 'flex', justifyContent: 'center' }}>
                {stats.tasksByStatus.length > 0
                  ? <div style={{ maxWidth: 260 }}><Doughnut data={taskStatusChart} options={chartOptions} /></div>
                  : <p style={{ color: '#8A9BB0', padding: 20 }}>Нет данных</p>
                }
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #D8E2EC', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #D8E2EC', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 3, height: 16, background: '#F5A623', borderRadius: 2 }}></div>
                <span style={{ fontWeight: 500, fontSize: 14 }}>Задачи по приоритетам</span>
              </div>
              <div style={{ padding: 16, display: 'flex', justifyContent: 'center' }}>
                {stats.tasksByPriority.length > 0
                  ? <div style={{ maxWidth: 260 }}><Doughnut data={taskPriorityChart} options={chartOptions} /></div>
                  : <p style={{ color: '#8A9BB0', padding: 20 }}>Нет данных</p>
                }
              </div>
            </div>
          </div>
        )}

        {/* Последняя новость и сотрудники по ролям */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #D8E2EC', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #D8E2EC', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 3, height: 16, background: '#0057A8', borderRadius: 2 }}></div>
                <span style={{ fontWeight: 500, fontSize: 14 }}>Важное событие</span>
              </div>
              <div style={{ padding: 16, flexGrow: 1 }}>
                {latestNews ? (
                  <div style={{ display: 'flex', gap: 16, alignItems: 'start' }}>
                    {latestNews.image_url && (
                      <img
                        src={latestNews.image_url}
                        alt="news"
                        style={{ width: 180, height: 120, objectFit: 'cover', borderRadius: 8 }}
                      />
                    )}
                    <div style={{ flexGrow: 1 }}>
                      <span style={{
                        background: '#F0F4F8',
                        padding: '4px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#445566'
                      }}>
                        {latestNews.category || 'Общее'}
                      </span>
                      <h5 style={{ marginTop: 12, fontWeight: 700, color: '#1A2B3C', fontSize: 20 }}>
                        {latestNews.title}
                      </h5>
                      <p style={{
                        color: '#6B7A8D',
                        fontSize: 14,
                        lineHeight: '1.5',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        margin: '8px 0'
                      }}>
                        {latestNews.content?.replace(/<[^>]*>/g, '') || 'Прочтите подробности этой новости...'}
                      </p>
                      <Link to="/news" style={{ color: '#0057A8', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
                        Подробнее →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: '#8A9BB0' }}>Новостей пока нет</p>
                )}
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #D8E2EC', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #D8E2EC', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 3, height: 16, background: '#8A9BB0', borderRadius: 2 }}></div>
                <span style={{ fontWeight: 500, fontSize: 14 }}>Сотрудники по ролям</span>
              </div>
              <div style={{ padding: 16, display: 'flex', justifyContent: 'center' }}>
                {stats.usersByRole.length > 0
                  ? <div style={{ maxWidth: 220 }}><Doughnut data={usersByRoleChart} options={chartOptions} /></div>
                  : <p style={{ color: '#8A9BB0', padding: 20 }}>Нет данных</p>
                }
              </div>
            </div>
          </div>
        )}

        {/* Нижняя часть: Новости и задачи */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #D8E2EC', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #D8E2EC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 3, height: 16, background: '#0057A8', borderRadius: 2 }}></div>
                <span style={{ fontWeight: 500, fontSize: 18 }}>Последние новости</span>
              </div>
              <Link to="/news" style={{ background: '#E8F0FB', color: '#0057A8', border: 'none', padding: '4px 12px', borderRadius: 5, fontSize: 16, textDecoration: 'none' }}>
                Все →
              </Link>
            </div>
            {news.length === 0
              ? <p style={{ color: '#8A9BB0', padding: '16px 18px', margin: 0 }}>Новостей пока нет</p>
              : news.map(n => (
                <div key={n.id} style={{ padding: '16px 20px', borderBottom: '1px solid #F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 16, color: '#1A2B3C', fontWeight: 500 }}>{n.title}</div>
                    <div style={{ fontSize: 14, color: '#8A9BB0', marginTop: 4 }}>{n.author_name} · {new Date(n.created_at).toLocaleDateString('ru-RU')}</div>
                  </div>
                  {n.urgent && (
                    <span style={{ background: '#FDEEEE', color: '#A32D2D', fontSize: 16, padding: '2px 8px', borderRadius: 4, fontWeight: 500, whiteSpace: 'nowrap' }}>
                      Срочно
                    </span>
                  )}
                </div>
              ))
            }
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #D8E2EC', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #D8E2EC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 3, height: 16, background: '#F5A623', borderRadius: 2 }}></div>
                <span style={{ fontWeight: 500, fontSize: 18 }}>Мои задачи</span>
              </div>
              <Link to="/tasks" style={{ background: '#E8F0FB', color: '#0057A8', border: 'none', padding: '4px 12px', borderRadius: 5, fontSize: 16, textDecoration: 'none' }}>
                Все →
              </Link>
            </div>
            {tasks.length === 0
              ? <p style={{ color: '#8A9BB0', padding: '16px 18px', margin: 0 }}>Задач пока нет</p>
              : tasks.map(t => {
                const badge = taskStatusBadge(t.status)
                return (
                  <div key={t.id} style={{ padding: '16px 20px', borderBottom: '1px solid #F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{fontSize: 16, color: '#1A2B3C', fontWeight: 500}}>{t.title}</span>
                      <span style={{
                          background: badge.bg,
                          color: badge.color,
                          fontSize: 16,
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontWeight: 500,
                          whiteSpace: 'nowrap'
                      }}>
                      {statusLabel(t.status)}
                    </span>
                  </div>
                )
              })
            }
          </div>
        </div>
      </div>
    </>
  )
}

export default DashboardPage