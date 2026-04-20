import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light text-center px-3">
      <h1 className="display-1 fw-bold text-primary">404</h1>
      <h4 className="fw-bold mb-2">Страница не найдена</h4>
      <p className="text-muted mb-4">
        Страница которую вы ищете не существует или была удалена.
      </p>
      <Link to="/" className="btn btn-primary px-4">
        Вернуться на главную
      </Link>
    </div>
  )
}

export default NotFoundPage