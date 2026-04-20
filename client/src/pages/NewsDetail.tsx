import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
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

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<News | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await api.get(`/news/${id}`)
        setArticle(res.data)
      } catch (err) {
        console.error("Ошибка при загрузке статьи")
      } finally {
        setLoading(false)
      }
    }
    fetchArticle()
  }, [id])

  if (loading) return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-white">
      <div className="spinner-border text-primary"></div>
    </div>
  )

  if (!article) return (
    <div className="container py-5 text-center">
      <h3>Статья не найдена</h3>
      <button className="btn btn-primary mt-3" onClick={() => navigate('/news')}>К списку новостей</button>
    </div>
  )

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <Navbar />

      {/* Шапка статьи с изображением */}
      {article.image_url ? (
        <div style={{ width: '100%', height: '500px', position: 'relative' }}>
          <img
            src={article.image_url}
            alt={article.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
            padding: '60px 0'
          }}>
            <div className="container">
              <span className="badge bg-primary mb-3 px-3 py-2">
                {article.category === 'order' ? 'Приказ' : article.category === 'event' ? 'Событие' : 'Общее'}
              </span>
              <h1 className="text-white fw-bold display-4">{article.title}</h1>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-light py-5 border-bottom">
          <div className="container py-4">
             <h1 className="fw-bold display-4" style={{ color: '#1A202C' }}>{article.title}</h1>
          </div>
        </div>
      )}

      <div className="container py-5">
        <div className="row">
          <div className="col-lg-8">
            {/* Мета-данные */}
            <div className="d-flex align-items-center gap-3 mb-5 pb-4 border-bottom">
              <div className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '45px', height: '45px' }}>
                {article.author_name.charAt(0)}
              </div>
              <div>
                <div className="fw-bold">{article.author_name}</div>
                <div className="text-muted small">
                  {new Date(article.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <button className="btn btn-outline-secondary btn-sm ms-auto" onClick={() => navigate(-1)}>
                Назад
              </button>
            </div>

            {/* Контент статьи */}
            <div className="article-content" style={{
              fontSize: '19px',
              lineHeight: '1.8',
              color: '#2D3748',
              whiteSpace: 'pre-line' // Чтобы сохранялись переносы строк из textarea
            }}>
              {article.content}
            </div>
          </div>

          {/* Боковая панель (опционально) */}
          <div className="col-lg-4 ps-lg-5">
            <div className="p-4 bg-light rounded-4 sticky-top" style={{ top: '100px' }}>
              <h5 className="fw-bold mb-3">Важная информация</h5>
              <p className="small text-muted">
                Данная публикация предназначена для внутреннего использования сотрудниками ПАО «Россети Волга».
                Распространение материалов без согласования запрещено.
              </p>
              <hr />
              <button className="btn btn-primary w-100" onClick={() => window.print()}>
                Печать статьи
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewsDetail