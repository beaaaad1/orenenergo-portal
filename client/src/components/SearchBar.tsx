import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

interface SearchResults {
  news: { id: number; title: string; category: string }[]
  documents: { id: number; title: string; filename: string }[]
  users: { id: number; name: string; email: string; department: string }[]
}

const SearchBar = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null)
      setOpen(false)
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await api.get('/search', { params: { q: query } })
        setResults(res.data)
        setOpen(true)
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  const hasResults = results && (
    results.news.length > 0 ||
    results.documents.length > 0 ||
    results.users.length > 0
  )

  const handleNavigate = (path: string) => {
    setQuery('')
    setOpen(false)
    setResults(null)
    navigate(path)
  }

  return (
    <div ref={ref} style={{ position: 'relative', width: 300 }}>
      <div className="input-group input-group-sm">
        <input
          type="text"
          className="form-control bg-white"
          placeholder="Поиск по порталу..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results && setOpen(true)}
        />
        {loading && (
          <span className="input-group-text bg-white">
            <span
              className="spinner-border spinner-border-sm text-secondary"
              style={{ width: 14, height: 14 }}
            />
          </span>
        )}
      </div>

      {open && (
        <div
          className="card shadow"
          style={{
            position: 'absolute',
            top: '110%',
            left: 0,
            right: 0,
            zIndex: 9999,
            maxHeight: 420,
            overflowY: 'auto',
          }}
        >
          {!hasResults ? (
            <div className="card-body text-center text-muted py-3">
              Ничего не найдено
            </div>
          ) : (
            <ul className="list-group list-group-flush">

              {results.news.length > 0 && (
                <>
                  <li className="list-group-item bg-light py-1">
                    <small className="text-muted fw-bold">📰 НОВОСТИ</small>
                  </li>
                  {results.news.map(n => (
                    <li
                      key={`news-${n.id}`}
                      className="list-group-item list-group-item-action"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleNavigate('/news')}
                    >
                      <p className="mb-0 small fw-bold">{n.title}</p>
                      <small className="text-muted">{n.category}</small>
                    </li>
                  ))}
                </>
              )}

              {results.documents.length > 0 && (
                <>
                  <li className="list-group-item bg-light py-1">
                    <small className="text-muted fw-bold">📁 ДОКУМЕНТЫ</small>
                  </li>
                  {results.documents.map(d => (
                    <li
                      key={`doc-${d.id}`}
                      className="list-group-item list-group-item-action"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleNavigate('/documents')}
                    >
                      <p className="mb-0 small fw-bold">{d.title}</p>
                      <small className="text-muted">{d.filename}</small>
                    </li>
                  ))}
                </>
              )}

              {results.users.length > 0 && (
                <>
                  <li className="list-group-item bg-light py-1">
                    <small className="text-muted fw-bold">👤 СОТРУДНИКИ</small>
                  </li>
                  {results.users.map(u => (
                    <li
                      key={`user-${u.id}`}
                      className="list-group-item list-group-item-action"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleNavigate('/users')}
                    >
                      <p className="mb-0 small fw-bold">{u.name}</p>
                      <small className="text-muted">
                        {u.department || u.email}
                      </small>
                    </li>
                  ))}
                </>
              )}

            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBar