import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Footer from './components/Footer'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import NewsPage from './pages/NewsPage'
import UsersPage from './pages/UsersPage'
import TasksPage from './pages/TasksPage'
import VacationsPage from './pages/VacationsPage'
import ProfilePage from './pages/ProfilePage'
import DocumentsPage from './pages/DocumentsPage'
import EventsPage from './pages/EventsPage'
import NotFoundPage from './pages/NotFoundPage'
import AdminPage from './pages/AdminPage'
import PrintPage from './pages/PrintPage'
import UserProfileDetail from './pages/UserProfileDetail'
import NewsDetail from './pages/NewsDetail'
import SupportChat from './pages/SupportChat';
import AdminSupport from './pages/AdminSupport';

import LandingPage from './pages/LandingPage';
import PublicTicketForm from './pages/PublicTicketForm';
import ChatAssistant from './components/ChatAssistant';
import ExternalRequestsPage from './pages/ExternalRequestsPage';
import RequestDetailPage from './pages/RequestDetailPage';
import ContractsPage from "./pages/ContractsPage.tsx";

// Импортируем наш новый вспомогательный файл-диспетчер
import ServiceRouteDispatcher from './components/ServiceRouteDispatcher';

const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth()
  return token ? <>{children}</> : <Navigate to="/login" />
}

const AppRoutes = () => {
  const { token } = useAuth()

  return (
    <div className="d-flex flex-column min-vh-100">
      <div className="flex-grow-1">
        <Routes>
            {/* ГЛАВНАЯ СТРАНИЦА ПЛАТФОРМЫ */}
            <Route path="/" element={token ? <PrivateRoute><DashboardPage /></PrivateRoute> : <LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* ЕДИНЫЙ УМНЫЙ МАРШРУТ ДЛЯ УСЛУГ */}
            {/* Он сам решит, кого отправить на ServiceDetailPage, а кого на карту техпроцесса */}
            <Route path="/service/:type" element={<ServiceRouteDispatcher />} />

            {/* Публичная форма подачи заявки для гостей */}
            <Route path="/service/:type/apply" element={<PublicTicketForm />} />

            {/* ВНУТРЕННИЕ МОДУЛИ СОТРУДНИКОВ */}
            <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
            <Route path="/news" element={<PrivateRoute><NewsPage /></PrivateRoute>} />
            <Route path="/users" element={<PrivateRoute><UsersPage /></PrivateRoute>} />
            <Route path="/tasks" element={<PrivateRoute><TasksPage /></PrivateRoute>} />
            <Route path="/vacations" element={<PrivateRoute><VacationsPage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/documents" element={<PrivateRoute><DocumentsPage /></PrivateRoute>} />
            <Route path="/events" element={<PrivateRoute><EventsPage /></PrivateRoute>} />
            <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
            <Route path="/print" element={<PrivateRoute><PrintPage /></PrivateRoute>} />
            <Route path="/profile/:id" element={<PrivateRoute><UserProfileDetail /></PrivateRoute>} />
            <Route path="/news/:id" element={<NewsDetail />} />
            <Route path="/support" element={<SupportChat />} />
            <Route path="/admin/support" element={<PrivateRoute><AdminSupport /></PrivateRoute>} />

            <Route path="/ExternalRequestsPage" element={<PrivateRoute><ExternalRequestsPage /></PrivateRoute>} />
            <Route path="/admin/requests/:id" element={<PrivateRoute><RequestDetailPage /></PrivateRoute>} />
            <Route path="/contracts" element={<PrivateRoute><ContractsPage /></PrivateRoute>} />

            {/* Маршрут ошибки — всегда в конце */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>

      {token && <ChatAssistant />}

      <Footer />
    </div>
  )
}

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App;