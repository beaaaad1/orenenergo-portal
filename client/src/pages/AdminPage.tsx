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
  created_at: string
}

// Обновленный интерфейс сообщения под новую базу
interface SupportMessage {
  id: number
  sender_id: number
  text: string
  is_admin_reply?: boolean
  created_at: string
}

const roleLabel = (role: string) => {
  if (role === 'ADMIN') return 'Администратор'
  if (role === 'MANAGER') return 'Руководитель'
  return 'Сотрудник'
}

const roleBadge = (role: string) => {
  if (role === 'ADMIN') return 'danger'
  if (role === 'MANAGER') return 'warning'
  return 'secondary'
}

const AdminPage = () => {
  const { isAdmin, user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'users' | 'stats' | 'support'>('users')
  const [stats, setStats] = useState({
    users: 0,
    news: 0,
    tasks: 0,
    documents: 0,
    vacations: 0,
    events: 0,
    support: 0,
  })

  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [replyText, setReplyText] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [changingRole, setChangingRole] = useState<number | null>(null)
  const [success, setSuccess] = useState('')

  const [showPassModal, setShowPassModal] = useState(false)
  const [selectedUserForPass, setSelectedUserForPass] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/')
      return
    }
    fetchData()
  }, [])

  // Если выбран пользователь в чате — подгружаем сообщения каждые 5 сек
  useEffect(() => {
    let interval: any;
    if (activeTab === 'support' && selectedUserId) {
      const fetchChat = async () => {
        try {
          const res = await api.get(`/support/chats/messages/${selectedUserId}`);
          setMessages(res.data);
        } catch (e) { console.error("Ошибка обновления чата"); }
      };
      fetchChat();
      interval = setInterval(fetchChat, 5000);
    }
    return () => clearInterval(interval);
  }, [selectedUserId, activeTab]);

  const fetchData = async () => {
    try {
      const [usersRes, newsRes, tasksRes, docsRes, vacRes, eventsRes] = await Promise.all([
        api.get('/users'),
        api.get('/news'),
        api.get('/tasks'),
        api.get('/documents'),
        api.get('/vacations'),
        api.get('/events'),
      ])

      setUsers(usersRes.data)

      setStats({
        users: usersRes.data.length,
        news: newsRes.data.length,
        tasks: tasksRes.data.length,
        documents: docsRes.data.length,
        vacations: vacRes.data.length,
        events: eventsRes.data.length,
        support: 0, // Можно добавить запрос на количество активных тикетов
      })
    } catch (error) {
      console.error("Ошибка при загрузке данных")
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: number, newRole: string) => {
    setChangingRole(userId)
    try {
      await api.put(`/users/${userId}/role`, { role: newRole })
      setSuccess('Роль успешно изменена!')
      setTimeout(() => setSuccess(''), 3000)
      fetchData()
    } catch {
      alert('Ошибка при изменении роли')
    } finally {
      setChangingRole(null)
    }
  }

  const handlePasswordChange = async () => {
    if (!selectedUserForPass || !newPassword.trim()) return;
    try {
      await api.put(`/users/${selectedUserForPass.id}/password`, { password: newPassword });
      setSuccess(`Пароль для ${selectedUserForPass.name} успешно изменен!`);
      setShowPassModal(false);
      setNewPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert("Ошибка при смене пароля на сервере");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить пользователя?')) return
    await api.delete(`/users/${id}`)
    fetchData()
  }

  const handleReply = async () => {
    if (!replyText.trim() || !selectedUserId) return;
    try {
      const res = await api.post(`/support/chats/messages/${selectedUserId}`, {
        text: replyText
      });
      setMessages([...messages, res.data]);
      setReplyText('');
    } catch {
      alert('Ошибка при отправке ответа');
    }
  };

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <div className="d-flex align-items-center gap-3 mb-4">
          <h4 className="fw-bold mb-0">Панель администратора</h4>
          <span className="badge bg-danger">ADMIN</span>
        </div>

        {success && <div className="alert alert-success py-2 mb-3">{success}</div>}

        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
              Управление пользователями
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'support' ? 'active' : ''}`} onClick={() => setActiveTab('support')}>
              Поддержка (Чаты)
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
              Статистика портала
            </button>
          </li>
        </ul>

        {loading && <p className="text-muted">Загрузка...</p>}

        {activeTab === 'users' && !loading && (
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white fw-bold">Все пользователи ({users.length})</div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Сотрудник</th><th>Email</th><th>Отдел</th><th>Роль</th><th>Регистрация</th><th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: 32, height: 32, fontSize: 14 }}>
                            {u.name.charAt(0)}
                          </div>
                          <span className="fw-bold">{u.name}</span>
                        </div>
                      </td>
                      <td className="text-muted small">{u.email}</td>
                      <td className="text-muted small">{u.department || '—'}</td>
                      <td><span className={`badge bg-${roleBadge(u.role)}`}>{roleLabel(u.role)}</span></td>
                      <td className="text-muted small">{new Date(u.created_at).toLocaleDateString('ru-RU')}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <select className="form-select form-select-sm" style={{ width: 140 }} value={u.role} disabled={changingRole === u.id} onChange={e => handleRoleChange(u.id, e.target.value)}>
                            <option value="EMPLOYEE">Сотрудник</option>
                            <option value="MANAGER">Руководитель</option>
                            <option value="ADMIN">Администратор</option>
                          </select>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              setSelectedUserForPass(u);
                              setShowPassModal(true);
                            }}
                          >
                            Пароль
                          </button>
                          <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(u.id)}>Удалить</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showPassModal && (
          <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow border-0">
                <div className="modal-header bg-primary text-white border-0">
                  <h5 className="modal-title">Смена пароля</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowPassModal(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <p className="small text-muted">Новый пароль для: <strong>{selectedUserForPass?.name}</strong></p>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Введите новый пароль"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="modal-footer border-0">
                  <button className="btn btn-light" onClick={() => setShowPassModal(false)}>Отмена</button>
                  <button className="btn btn-primary px-4" onClick={handlePasswordChange}>Обновить</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'support' && !loading && (
          <div className="card shadow-sm border-0" style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}>
            <div className="row g-0 h-100">
              <div className="col-md-4 border-end h-100 d-flex flex-column">
                <div className="p-3 border-bottom bg-light fw-bold">Сотрудники</div>
                <div className="overflow-auto flex-grow-1">
                  {users.filter(u => u.id !== currentUser?.id).map((u) => (
                    <div
                      key={u.id}
                      onClick={() => { setSelectedUserId(u.id); setMessages([]); }}
                      className={`p-3 border-bottom cursor-pointer ${selectedUserId === u.id ? 'bg-primary bg-opacity-10 border-start border-primary border-4' : ''}`}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="fw-bold small">{u.name}</div>
                      <div className="text-muted small" style={{ fontSize: '11px' }}>{u.department}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-md-8 h-100 d-flex flex-column bg-light">
                {selectedUserId ? (
                  <>
                    <div className="p-3 border-bottom bg-white fw-bold">
                      Чат с: {users.find(u => u.id === selectedUserId)?.name}
                    </div>
                    <div className="flex-grow-1 p-3 overflow-auto">
                      {messages.map((msg, idx) => {
                         const isMine = msg.sender_id === currentUser?.id;
                         return (
                          <div key={idx} className={`d-flex mb-3 ${isMine ? 'justify-content-end' : 'justify-content-start'}`}>
                            <div className={`p-3 rounded-3 shadow-sm ${isMine ? 'bg-primary text-white' : 'bg-white text-dark border'}`} style={{ maxWidth: '75%' }}>
                              <p className="mb-1 small">{msg.text}</p>
                              <div className="text-end" style={{ fontSize: '10px', opacity: 0.7 }}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                         )
                      })}
                    </div>
                    <div className="p-3 border-top bg-white">
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control bg-light border-0 shadow-none"
                          placeholder="Введите сообщение..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                        />
                        <button className="btn btn-primary" onClick={handleReply}>Отправить</button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-100 d-flex align-items-center justify-content-center text-muted">
                    Выберите сотрудника для просмотра переписки
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && !loading && (
          <div className="row g-3">
            {[
              { label: 'Сотрудников', val: stats.users, col: 'primary' },
              { label: 'Новостей', val: stats.news, col: 'success' },
              { label: 'Задач', val: stats.tasks, col: 'warning' },
              { label: 'Документов', val: stats.documents, col: 'info' },
              { label: 'Заявок на отпуск', val: stats.vacations, col: 'secondary' },
              { label: 'Событий', val: stats.events, col: 'danger' },
            ].map((s, i) => (
              <div key={i} className="col-md-4">
                <div className={`card text-center border-0 h-100 shadow-sm border-top border-${s.col} border-4`}>
                  <div className="card-body">
                    <h2 className={`text-${s.col} fw-bold`}>{s.val}</h2>
                    <p className="text-muted mb-0 small">{s.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default AdminPage