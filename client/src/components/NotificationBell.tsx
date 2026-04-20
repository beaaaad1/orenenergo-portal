import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

interface Notification {
  id: string
  type: string
  text: string
  date: string
  link: string
}

const typeIcon = (type: string) => {
  if (type === 'news') return '📰'
  if (type === 'task') return '✅'
  if (type === 'vacation') return '🏖️'
  if (type === 'event') return '📅'
  return '🔔'
}

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [read, setRead] = useState<string[]>([])
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data)
    } catch {
      // тихо игнорируем ошибку
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const unread = notifications.filter(n => !read.includes(n.id)).length

  const handleOpen = () => {
    setOpen(!open)
    if (!open) {
      setRead(notifications.map(n => n.id))
    }
  }

  const handleClick = (link: string) => {
    setOpen(false)
    navigate(link)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="btn btn-outline-light btn-sm position-relative"
        onClick={handleOpen}
        style={{ width: 38, height: 38 }}
      >
        🔔
        {unread > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: 10 }}
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="card shadow"
          style={{
            position: 'absolute',
            right: 0,
            top: '110%',
            width: 340,
            zIndex: 9999,
            maxHeight: 420,
            overflowY: 'auto',
          }}
        >
          <div className="card-header fw-bold d-flex justify-content-between align-items-center">
            <span>Уведомления</span>
            <span className="badge bg-primary">{notifications.length}</span>
          </div>
          {notifications.length === 0 ? (
            <div className="card-body text-center text-muted py-4">
              Нет уведомлений
            </div>
          ) : (
            <ul className="list-group list-group-flush">
              {notifications.map(n => (
                <li
                  key={n.id}
                  className="list-group-item list-group-item-action"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleClick(n.link)}
                >
                  <div className="d-flex gap-2 align-items-start">
                    <span style={{ fontSize: 18 }}>{typeIcon(n.type)}</span>
                    <div>
                      <p className="mb-0 small">{n.text}</p>
                      <small className="text-muted">{formatDate(n.date)}</small>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell