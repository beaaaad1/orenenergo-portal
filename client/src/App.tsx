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
import LandingPage from './pages/LandingPage';
import PublicTicketForm from './pages/PublicTicketForm';
import ChatAssistant from './components/ChatAssistant';
import ServiceDetailPage from './pages/ServiceDetailPage';
import ExternalRequestsPage from './pages/ExternalRequestsPage';
import RequestDetailPage from './pages/RequestDetailPage';

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
            <Route path="/" element={
  token ? <PrivateRoute><DashboardPage/></PrivateRoute> : <LandingPage />
}/>

{/* Новая страница для заявок от обычных пользователей */}
<Route path="/request/:type" element={<PublicTicketForm />} />
            {/* 2. Новая страница формы заявок */}
            <Route path="/request/:type" element={<PublicTicketForm />} />

            {/* 3. Дашборд теперь доступен по этому адресу */}
            <Route path="/dashboard" element={<PrivateRoute><DashboardPage/></PrivateRoute>}/>
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
            <Route path="/service/:type" element={<ServiceDetailPage />} />
            <Route path="/ExternalRequestsPage" element={<ExternalRequestsPage />} />
            <Route path="/admin/requests/:id" element={<RequestDetailPage />} />
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

export default App