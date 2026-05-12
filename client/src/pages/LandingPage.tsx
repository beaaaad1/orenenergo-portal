import { useEffect, useState } from 'react';
import {Link, useNavigate} from 'react-router-dom';
import api from '../api/axios';
import homeIcon from '../assets/logo.svg'


interface News {
  id: number;
  title: string;
  category: string;
  created_at: string;
  author_name: string;
  content?: string;
  image_url?: string;
}

const Logo = () => (
    <img src={homeIcon} width="180" height="60" alt="Logo" style={{ objectFit: 'contain' }} />
)

const LandingPage = () => {
  const navigate = useNavigate();
  const [news, setNews] = useState<News[]>([]);

  useEffect(() => {
    api.get('/news').then(res => setNews(res.data.slice(0, 3)));
  }, []);

  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div style={{ background: '#F0F4F8', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      <div style={{ background: '#0057A8', borderBottom: '1px solid #D8E2EC', padding: '10px 140px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link className="navbar-brand me-4" to="/">
            <Logo />
        </Link>
        <button
          onClick={() => navigate('/login')}
          style={{ background: '#fff', color: '#0057A8', border: 'none', padding: '8px 20px', borderRadius: 8, fontWeight: 500, cursor: 'pointer' }}
        >
          Вход для персонала
        </button>
      </div>

      <div style={{ padding: '24px 8px', margin: '0 100px', flexGrow: 1 }}>

        {/* Приветственный баннер */}
        <div style={{
          background: '#0057A8',
          borderRadius: 12,
          padding: '30px 40px',
          marginBottom: 24,
          color: '#fff'
        }}>
          <h2 style={{ fontWeight: 600, marginBottom: 8 }}>Филиал ПАО «Россети Волга» — «Оренбургэнерго»</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>Информационный портал для граждан и организаций · {today}</p>
        </div>

        {/* Сетка услуг (в стиле виджетов Dashboard) */}
        <h4 style={{ marginBottom: 16, fontWeight: 600, color: '#1A2B3C', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 4, height: 18, background: '#F5A623', borderRadius: 2 }}></div>
          Услуги и заявки
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { title: 'Солнечные панели', desc: 'Установка и обслуживание фотоэлектрических систем', type: 'solar', icon: '☀️' },
            { title: 'Наружное освещение', desc: 'Размещение и проектирование систем уличного освещения', type: 'lighting', icon: '🏮' },
          { title: 'Подключение к электросетям', desc: 'Стандартное технологическое присоединение к сетям', type: 'connect', icon: '🔌' },
          { title: 'Объекты генерации', desc: 'Подключение мощностей по производству электроэнергии', type: 'generation', icon: '🏭' },
          { title: 'Перераспределение мощности', desc: 'Передача свободной мощности между потребителями', type: 'power-share', icon: '🔄' },
          { title: 'Монтажные и ремонтные работы', desc: 'Строительно-монтажные работы любой сложности', type: 'construction', icon: '🛠️' },
          ].map((service, i) => (
            <div
              key={i}
              onClick={() => navigate(`/service/${service.type}`)}
              style={{
                background: '#fff',
                borderRadius: 10,
                padding: '24px',
                border: '1px solid #D8E2EC',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0057A8')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#D8E2EC')}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>{service.icon}</div>
              <h5 style={{ color: '#0057A8', fontWeight: 600, marginBottom: 8 }}>{service.title}</h5>
              <p style={{ color: '#6B7A8D', fontSize: 14, margin: 0, lineHeight: 1.5 }}>{service.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #D8E2EC', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #D8E2EC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 3, height: 16, background: '#0057A8', borderRadius: 2 }}></div>
              <span style={{ fontWeight: 600, fontSize: 18 }}>Новости компании</span>
            </div>
          </div>

          {news.length === 0 ? (
            <p style={{ color: '#8A9BB0', padding: 20 }}>Загрузка новостей...</p>
          ) : (
            news.map(n => (
              <div
                key={n.id}
                style={{
                  padding: '20px',
                  borderBottom: '1px solid #F0F4F8',
                  display: 'flex',
                  gap: 20,
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/news/${n.id}`)}
              >
                {n.image_url && (
                  <img src={n.image_url} alt="" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                )}
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontSize: 12, color: '#F5A623', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                    {n.category || 'Общее'}
                  </div>
                  <div style={{ fontSize: 17, color: '#1A2B3C', fontWeight: 600 }}>{n.title}</div>
                  <div style={{ fontSize: 13, color: '#8A9BB0', marginTop: 4 }}>
                    {new Date(n.created_at).toLocaleDateString('ru-RU')} · Оренбургэнерго
                  </div>
                </div>
                <span style={{ color: '#0057A8', fontSize: 20 }}>→</span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default LandingPage;