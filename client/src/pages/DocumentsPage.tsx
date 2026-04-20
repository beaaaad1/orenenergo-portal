import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

interface Document {
  id: number
  title: string
  filename: string
  filepath: string
  category: string
  department: string | null
  uploaded_by_name: string
  created_at: string
}

const categoryLabel = (cat: string) => {
  const labels: Record<string, string> = {
    general: 'Общее', order: 'Приказ', hr: 'Кадры',
    finance: 'Финансы', technical: 'Технические'
  }
  return labels[cat] || cat
}

const fileInfo = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return { icon: '📕', color: '#E53E3E', label: 'PDF' }
  if (['doc', 'docx'].includes(ext || '')) return { icon: '📘', color: '#3182CE', label: 'Word' }
  if (['xls', 'xlsx'].includes(ext || '')) return { icon: '📗', color: '#38A169', label: 'Excel' }
  if (['png', 'jpg', 'jpeg'].includes(ext || '')) return { icon: '🖼️', color: '#805AD5', label: 'Image' }
  return { icon: '📄', color: '#718096', label: 'DOC' }
}

const DocumentsPage = () => {
  const { isAdmin, user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ title: '', category: 'general', department: '' })
  const [file, setFile] = useState<File | null>(null)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const fetchDocuments = async () => {
    const params: any = {}
    if (filterCategory) params.category = filterCategory
    const res = await api.get('/documents', { params })
    setDocuments(res.data)
    setLoading(false)
  }

  useEffect(() => { fetchDocuments() }, [filterCategory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { setError('Выберите файл'); return }
    setUploading(true)
    setError('')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', form.title || file.name)
    formData.append('category', form.category)
    formData.append('department', form.department)

    try {
      await api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm({ title: '', category: 'general', department: '' })
      setFile(null)
      setShowForm(false)
      setSuccess('Документ успешно загружен')
      setTimeout(() => setSuccess(''), 3000)
      fetchDocuments()
    } catch { setError('Ошибка при загрузке') } finally { setUploading(false) }
  }

  const handleDownload = async (doc: Document) => {
    const res = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', doc.filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить документ безвозвратно?')) return
    await api.delete(`/documents/${id}`)
    fetchDocuments()
  }

  const filtered = documents.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.filename.toLowerCase().includes(search.toLowerCase()) ||
    d.uploaded_by_name.toLowerCase().includes(search.toLowerCase())
  )

  const canUpload = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  return (
    <div style={{ backgroundColor: '#F4F7F9', minHeight: '100vh' }}>
      <Navbar />
      <div className="container py-5">

        <div className="d-flex justify-content-between align-items-end mb-5">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: '#1A202C' }}>Библиотека документов</h2>
            <p className="text-muted mb-0">Хранилище нормативно-правовых и внутренних актов</p>
          </div>
          {canUpload && (
            <button
              className="btn text-white shadow-sm px-4"
              onClick={() => setShowForm(!showForm)}
              style={{ backgroundColor: '#00A1E4', borderRadius: '10px', fontWeight: '500' }}
            >
              {showForm ? 'Отмена' : '+ Загрузить документ'}
            </button>
          )}
        </div>

        {success && <div className="alert border-0 shadow-sm text-white mb-4" style={{ backgroundColor: '#48BB78' }}>{success}</div>}

        {showForm && canUpload && (
          <div className="card border-0 shadow-sm mb-5" style={{ borderRadius: '15px' }}>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">Загрузка нового документа</h5>
              {error && <div className="alert alert-light text-danger border-0">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="row g-4">
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-bold">НАЗВАНИЕ ДОКУМЕНТА</label>
                    <input className="form-control bg-light border-0" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="По умолчанию — имя файла" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-bold">КАТЕГОРИЯ</label>
                    <select className="form-select bg-light border-0" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      <option value="general">Общее</option>
                      <option value="order">Приказ</option>
                      <option value="hr">Кадры</option>
                      <option value="finance">Финансы</option>
                      <option value="technical">Технические</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-bold">ОТДЕЛ / ПОДРАЗДЕЛЕНИЕ</label>
                    <input className="form-control bg-light border-0" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-bold">ВЫБОР ФАЙЛА</label>
                    <input type="file" className="form-control bg-light border-0" onChange={e => setFile(e.target.files?.[0] || null)} required />
                  </div>
                  <div className="col-12 text-end mt-4">
                    <button type="submit" className="btn btn-dark px-5" disabled={uploading} style={{ borderRadius: '10px' }}>
                      {uploading ? 'Выполняется загрузка...' : 'Подтвердить загрузку'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="row g-3 mb-5">
          <div className="col-md-8 position-relative">
            <input
              className="form-control border-0 shadow-sm ps-5"
              placeholder="Поиск по названию или автору..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ borderRadius: '12px', height: '50px' }}
            />
            <span className="position-absolute top-50 translate-middle-y ms-3">🔍</span>
          </div>
          <div className="col-md-4">
            <select
              className="form-select border-0 shadow-sm px-3"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              style={{ borderRadius: '12px', height: '50px' }}
            >
              <option value="">Все категории документов</option>
              <option value="general">Общее</option>
              <option value="order">Приказы</option>
              <option value="hr">Кадры</option>
              <option value="finance">Финансы</option>
              <option value="technical">Технические</option>
            </select>
          </div>
        </div>

        {loading && <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}

        <div className="row g-4">
          {filtered.map(doc => {
            const info = fileInfo(doc.filename)
            return (
              <div key={doc.id} className="col-md-6 col-lg-4">
                <div
                  className="card h-100 border-0 shadow-sm"
                  style={{ borderRadius: '16px', transition: '0.3s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div className="card-body p-4">
                    <div className="d-flex align-items-start gap-3 mb-3">
                      <div
                        className="rounded-3 d-flex align-items-center justify-content-center shadow-sm"
                        style={{ width: '56px', height: '56px', backgroundColor: '#F8FAFC', fontSize: '28px', border: `2px solid ${info.color}20`, flexShrink: 0 }}
                      >
                        {info.icon}
                      </div>

                      {/* ОБНОВЛЕННЫЙ БЛОК С ФИКСОМ ТЕКСТА */}
                      <div className="flex-grow-1 min-w-0" style={{ overflow: 'hidden' }}>
                        <h6
                          className="fw-bold mb-1"
                          style={{
                            color: '#2D3748',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            wordBreak: 'break-word'
                          }}
                        >
                          {doc.title}
                        </h6>
                        <p
                          className="text-muted mb-2"
                          style={{
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%'
                          }}
                          title={doc.filename}
                        >
                          {doc.filename}
                        </p>
                        <div className="d-flex flex-wrap gap-1">
                          <span className="badge" style={{ backgroundColor: '#EDF2F7', color: '#4A5568', fontSize: '10px' }}>
                            {categoryLabel(doc.category)}
                          </span>
                          {doc.department && (
                            <span className="badge" style={{ backgroundColor: '#EBF8FF', color: '#2B6CB0', fontSize: '10px' }}>
                              {doc.department}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* КОНЕЦ ФИКСА */}

                    </div>
                    <hr className="text-muted opacity-25" />
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <div className="small text-muted" style={{ fontSize: '11px' }}>
                        <div className="fw-bold text-dark">{doc.uploaded_by_name}</div>
                        <div>{new Date(doc.created_at).toLocaleDateString('ru-RU')}</div>
                      </div>
                      <div className="d-flex gap-2">
                        {(isAdmin() || user?.role === 'MANAGER') && (
                          <button
                            className="btn btn-sm text-danger border-0 p-0 me-2"
                            onClick={() => handleDelete(doc.id)}
                            style={{ fontSize: '18px' }}
                            title="Удалить"
                          >
                            🗑️
                          </button>
                        )}
                        <button
                          className="btn btn-sm px-3 text-white"
                          onClick={() => handleDownload(doc)}
                          style={{ backgroundColor: info.color, borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}
                        >
                          Скачать
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && !loading && (
          <div className="text-center py-5 bg-white rounded-4 shadow-sm mt-4">
             <div style={{ fontSize: '40px' }}>📂</div>
             <p className="text-muted mt-2">Документы, соответствующие запросу, не найдены</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DocumentsPage