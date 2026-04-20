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
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// 1. ИМПОРТИРУЕМ ТВОЙ НОВЫЙ КОМПОНЕНТ
import ChatAssistant from './components/ChatAssistant';

const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth()
  return token ? <>{children}</> : <Navigate to="/login" />
}

const AppRoutes = () => {
  const { token } = useAuth() // Получаем токен, чтобы показывать бота только авторизованным

  return (
    <div className="d-flex flex-column min-vh-100">
      <div className="flex-grow-1">
        <Routes>
            <Route path="/login" element={<LoginPage/>}/>
            <Route path="/" element={<PrivateRoute><DashboardPage/></PrivateRoute>}/>
            <Route path="/news" element={<PrivateRoute><NewsPage/></PrivateRoute>}/>
            <Route path="/users" element={<PrivateRoute><UsersPage/></PrivateRoute>}/>
            <Route path="/tasks" element={<PrivateRoute><TasksPage/></PrivateRoute>}/>
            <Route path="/vacations" element={<PrivateRoute><VacationsPage/></PrivateRoute>}/>
            <Route path="/profile" element={<PrivateRoute><ProfilePage/></PrivateRoute>}/>
            <Route path="/documents" element={<PrivateRoute><DocumentsPage/></PrivateRoute>}/>
            <Route path="/events" element={<PrivateRoute><EventsPage/></PrivateRoute>}/>
            <Route path="*" element={<NotFoundPage/>}/>
            <Route path="/admin" element={<PrivateRoute><AdminPage/></PrivateRoute>}/>
            <Route path="/print" element={<PrivateRoute><PrintPage /></PrivateRoute>} />
            <Route path="/profile/:id" element={<UserProfileDetail />} />
            <Route path="/news/:id" element={<NewsDetail />} />
            <Route path="/support" element={<SupportChat />} />
            <Route path="/admin/support" element={<AdminSupport />} />
        </Routes>
      </div>

      {/* 2. ВСТАВЛЯЕМ БОТА ЗДЕСЬ */}
      {/* Условие {token && ...} гарантирует, что бот не появится на странице входа */}
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

export default App