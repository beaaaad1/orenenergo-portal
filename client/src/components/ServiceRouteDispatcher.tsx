import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Импортируем публичную страницу гостя
import ServiceDetailPage from '../pages/ServiceDetailPage';

// Импортируем внутренние страницы сотрудников
import SolarServicePage from '../pages/services/SolarServicePage';
import LightingServicePage from '../pages/services/LightingServicePage';
import ConnectServicePage from '../pages/services/ConnectServicePage';
import GenerationServicePage from '../pages/services/GenerationServicePage';
import PowerShareServicePage from '../pages/services/PowerShareServicePage';
import ConstructionServicePage from '../pages/services/ConstructionServicePage';

const ServiceRouteDispatcher = () => {
  const { type } = useParams();
  const { token } = useAuth();

  // 1. Если пользователь НЕ авторизован — ВСЕГДА отправляем его на общую инфо-страницу
  if (!token) {
    return <ServiceDetailPage />;
  }

  // 2. Если пользователь АВТОРИЗОВАН (сотрудник) — отдаем ему нужную технологическую карту
  switch (type) {
    case 'solar':
      return <SolarServicePage />;
    case 'lighting':
      return <LightingServicePage />;
    case 'connect':
      return <ConnectServicePage />;
    case 'generation':
      return <GenerationServicePage />;
    case 'power-share':
      return <PowerShareServicePage />;
    case 'construction':
      return <ConstructionServicePage />;
    default:
      return <ServiceDetailPage />;
  }
};

export default ServiceRouteDispatcher;