import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

interface News {
  id: number
  title: string
  content: string
  category: string
  urgent: boolean
  pinned: boolean
  image_url: string | null
  created_at: string
  author_name: string
}

const categoryLabel = (cat: string) => {
  const labels: Record<string, string> = { general: 'Общее', order: 'Приказ', event: 'Событие' }
  return labels[cat] || cat
}

const NewsPage = () => {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    title: '', content: '', category: 'general', urgent: false, pinned: false,
  })

  const fetchNews = async () => {
    try {
      setLoading(true)
      const res = await api.get('/news')
      setNews(res.data)
    } catch (err) {
      console.error("Ошибка при загрузке ленты новостей")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNews() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('title', form.title)
    formData.append('content', form.content)
    formData.append('category', form.category)
    formData.append('urgent', String(form.urgent))
    formData.append('pinned', String(form.pinned))
    if (imageFile) formData.append('image', imageFile)

    try {
      await api.post('/news', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setForm({ title: '', content: '', category: 'general', urgent: false, pinned: false })
      setImageFile(null)
      setShowForm(false)
      fetchNews()
    } catch (err) {
      alert("Не удалось опубликовать статью")
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation() // Чтобы не сработал переход к статье при клике на удаление
    if (!confirm('Вы уверены, что хотите удалить эту публикацию?')) return
    try {
      await api.delete(`/news/${id}`)
      fetchNews()
    } catch (err) {
      alert("Ошибка при удалении")
    }
  }

  return (
    <div style={{ backgroundColor: '#F4F7F9', minHeight: '100vh' }}>
      <Navbar />
      <div className="container py-5">

        {/* Шапка */}
        <div className="d-flex justify-content-between align-items-center mb-5">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: '#1A202C' }}>Пресс-центр</h2>
            <p className="text-muted mb-0">Информационный портал электросетевого комплекса</p>
          </div>
          {isAdmin() && (
            <button
              className={`btn shadow-sm px-4 fw-bold ${showForm ? 'btn-light' : 'btn-primary'}`}
              onClick={() => setShowForm(!showForm)}
              style={{ borderRadius: '12px' }}
            >
              {showForm ? 'Отмена' : '+ Написать статью'}
            </button>
          )}
        </div>

        {/* Форма создания */}
        {showForm && (
          <div className="card border-0 shadow-lg mb-5" style={{ borderRadius: '20px' }}>
            <div className="card-body p-4 p-md-5">
              <h4 className="fw-bold mb-4">Новая публикация</h4>
              <form onSubmit={handleSubmit}>
                <div className="row g-4">
                  <div className="col-md-8">
                    <label className="form-label small fw-bold text-muted text-uppercase">Заголовок статьи</label>
                    <input
                      className="form-control form-control-lg border-2"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-muted text-uppercase">Обложка (фото)</label>
                    <input
                      type="file"
                      className="form-control form-control-lg border-2"
                      onChange={e => setImageFile(e.target.files?.[0] || null)}
                      accept="image/*"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-bold text-muted text-uppercase">Текст новости</label>
                    <textarea
                      className="form-control border-2"
                      rows={6}
                      value={form.content}
                      onChange={e => setForm({ ...form, content: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-12 d-flex gap-4">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" checked={form.pinned} onChange={e => setForm({ ...form, pinned: e.target.checked })} id="pinnedSwitch" />
                      <label className="form-check-label fw-bold" htmlFor="pinnedSwitch">Закрепить</label>
                    </div>
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" checked={form.urgent} onChange={e => setForm({ ...form, urgent: e.target.checked })} id="urgentSwitch" />
                      <label className="form-check-label fw-bold text-danger" htmlFor="urgentSwitch">Срочно</label>
                    </div>
                    <button type="submit" className="btn btn-primary px-5 ms-auto fw-bold" style={{ borderRadius: '10px' }}>Опубликовать</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Загрузка ленты событий...</p>
          </div>
        ) : (
          <div className="row g-4">
            {news.map(n => (
              <div key={n.id} className={n.pinned ? 'col-12' : 'col-md-6 col-lg-4'}>
                <div
                  className="card h-100 border-0 shadow-sm overflow-hidden"
                  style={{ borderRadius: '20px', cursor: 'pointer', transition: 'transform 0.2s' }}
                  onClick={() => navigate(`/news/${n.id}`)}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {n.image_url && (
                    <div style={{ height: n.pinned ? '450px' : '220px', overflow: 'hidden' }}>
                      <img src={n.image_url} className="w-100 h-100" style={{ objectFit: 'cover' }} alt="" />
                    </div>
                  )}
                  <div className="card-body p-4">
                    <div className="d-flex gap-2 mb-3">
                      {n.pinned && <span className="badge bg-primary px-3 py-2">📌 Главная новость</span>}
                      {n.urgent && <span className="badge bg-danger px-3 py-2">🔥 Важно</span>}
                      <span className="badge bg-light text-dark border px-3 py-2">{categoryLabel(n.category)}</span>
                    </div>

                    <h3 className={n.pinned ? 'display-6 fw-bold mb-3' : 'h4 fw-bold mb-3'} style={{ color: '#2D3748' }}>
                      {n.title}
                    </h3>

                    <p className="text-muted" style={{
                      fontSize: n.pinned ? '18px' : '15px',
                      display: '-webkit-box',
                      WebkitLineClamp: n.pinned ? '6' : '3',
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: '1.6'
                    }}>
                      {n.content}
                    </p>

                    <div className="d-flex align-items-center justify-content-between mt-4 pt-4 border-top">
                      <div className="d-flex align-items-center gap-2">
                        <div className="bg-dark rounded-circle text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                          {n.author_name.charAt(0)}
                        </div>
                        <span className="small fw-bold text-dark">{n.author_name}</span>
                      </div>
                      <span className="small text-muted">{new Date(n.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span>
                    </div>

                    {isAdmin() && (
                      <button
                        onClick={(e) => handleDelete(e, n.id)}
                        className="btn btn-sm btn-link text-danger text-decoration-none mt-3 p-0 fw-bold"
                      >
                        Удалить статью
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {news.length === 0 && !loading && (
          <div className="text-center py-5 bg-white rounded-4 shadow-sm border">
            <h4 className="text-muted">Новостей пока нет</h4>
            <p className="text-muted small">Будьте первым, кто опубликует важное событие!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default NewsPage