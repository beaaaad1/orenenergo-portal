import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import homeIconBlue from "../assets/logoblue.svg";

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch {
      setError('Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">

      <div className="card shadow p-4" style={{ width: '100%', maxWidth: '420px' }}>
        <div className="text-center mb-4">
          <img src={homeIconBlue} alt="logo" width={200} height={62} style={{margin: '10px 0', paddingBottom: '10px'}} />
          <h4 className="fw-bold text-primary">Оренбургэнерго</h4>
          <p className="text-muted">Корпоративный портал</p>
        </div>

        {error && <div className="alert alert-danger py-2" style={{fontSize: '14px'}}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ваш логин"
              required
            />
          </div>
          <div className="mb-4">
            <label className="form-label">Пароль</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-100 mb-3"
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>

          <div className="text-center">
            <button
              type="button"
              className="btn btn-link btn-sm text-decoration-none shadow-none"
              onClick={() => navigate('/support')}
            >
              Забыли пароль? Связаться с поддержкой
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;