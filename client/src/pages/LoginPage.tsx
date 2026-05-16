import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import homeIconBlue from "../assets/logoblue.svg";

// Импортируем иконки
import eyeOpen from '../assets/icons/eye-open.svg';
import eyeClose from '../assets/icons/eye-close.svg';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="card shadow p-4" style={{ width: '100%', maxWidth: '420px', borderRadius: '15px', position: 'relative' }}>

        {/* Кнопка возврата на главную */}
        <button
          onClick={() => navigate('/')}
          className="btn btn-link text-decoration-none p-0 mb-3 d-flex align-items-center text-muted"
          style={{ fontSize: '14px', border: 'none', boxShadow: 'none' }}
        >
          <span style={{ marginRight: '5px', fontSize: '18px' }}>←</span>
          На главную
        </button>

        <div className="text-center mb-4">
          <img src={homeIconBlue} alt="logo" width={200} height={62} style={{ margin: '10px 0', paddingBottom: '10px' }} />
          <h4 className="fw-bold text-primary">Оренбургэнерго</h4>
          <p className="text-muted">Корпоративный портал</p>
        </div>

        {error && <div className="alert alert-danger py-2" style={{ fontSize: '14px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Email</label>
            <input
              type="email"
              className="form-control bg-light border-0"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ivanov@orenenergo.ru"
              required
              style={{ borderRadius: '10px', padding: '12px' }}
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Пароль</label>
            <div className="position-relative" style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control bg-light border-0"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  borderRadius: '10px',
                  padding: '12px',
                  paddingRight: '45px',
                  width: '100%'
                }}
              />
              <button
                type="button"
                className="btn border-0 position-absolute"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  right: '10px',
                  zIndex: 10,
                  background: 'transparent',
                  boxShadow: 'none',
                  padding: '0 5px',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <img
                  src={showPassword ? eyeClose : eyeOpen}
                  alt="toggle password"
                  style={{ width: '20px', height: '20px', opacity: 0.6 }}
                />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 mb-3"
            disabled={loading}
            style={{
              borderRadius: '10px',
              padding: '12px',
              fontWeight: '600',
              backgroundColor: '#0057A8',
              border: 'none'
            }}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status"></span>
            ) : 'Войти в систему'}
          </button>

          <div className="text-center">
            <button
              type="button"
              className="btn btn-link btn-sm text-decoration-none shadow-none text-muted"
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