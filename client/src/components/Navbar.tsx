import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import homeIcon from '../assets/logo.svg'
import NotificationBell from './NotificationBell'
import SearchBar from './SearchBar'

const Logo = () => (
    <img src={homeIcon} width="180" height="60" alt="Logo" style={{ objectFit: 'contain' }} />
)

const Navbar = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [isNavCollapsed, setIsNavCollapsed] = useState(true)

    const handleNavCollapse = () => setIsNavCollapsed(!isNavCollapsed)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const navLinkStyle = {
        fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
        fontSize: '16px',
        color: 'white',
        fontWeight: '600',
        transition: 'all 0.2s ease-in-out',
        letterSpacing: '0.2px'
    }

    return (
        <nav className="navbar navbar-expand-lg navbar-dark shadow-sm" style={{ padding: '0.6rem 0', backgroundColor: '#0057A8'}}>
            <div className="container">
                <Link className="navbar-brand me-4" to="/">
                    <Logo />
                </Link>

                <button
                    className="navbar-toggler border-0 shadow-none"
                    type="button"
                    onClick={handleNavCollapse}
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className={`${isNavCollapsed ? 'collapse' : ''} navbar-collapse`} id="navMenu">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0 align-items-center gap-2">

                        {/* ГРУППА: ИНФОРМАЦИЯ */}
                        <li className="nav-item dropdown">
                            <a
                                className="nav-link dropdown-toggle px-3 text-white"
                                href="#"
                                id="infoDropdown"
                                role="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                                style={navLinkStyle}
                            >
                                Информация
                            </a>
                            <ul className="dropdown-menu shadow border-0 mt-2" aria-labelledby="infoDropdown">
                                <li><Link className="dropdown-item py-2" to="/news">Новости</Link></li>
                                <li><Link className="dropdown-item py-2" to="/documents">Документы</Link></li>
                                <li><Link className="dropdown-item py-2" to="/events">События</Link></li>
                            </ul>
                        </li>

                        {/* ОСТАЛЬНЫЕ ССЫЛКИ */}
                        {[
                            { to: "/users", label: "Сотрудники" },
                            { to: "/tasks", label: "Задачи" },
                            { to: "/vacations", label: "Отпуска" },
                            { to: "/support", label: "Мессенджер" }
                        ].map((item) => (
                            <li className="nav-item" key={item.to}>
                                <Link
                                    className="nav-link px-3"
                                    to={item.to}
                                    style={navLinkStyle}
                                    onClick={() => setIsNavCollapsed(true)}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        ))}

                        {user?.role === 'ADMIN' && (
                            <li className="nav-item">
                                <Link
                                    className="nav-link px-3 text-warning fw-bold"
                                    to="/admin"
                                    style={{ ...navLinkStyle, color: '#FFD700' }}
                                    onClick={() => setIsNavCollapsed(true)}
                                >
                                    Админ
                                </Link>
                            </li>
                        )}
                    </ul>

                    <div className="d-flex align-items-center gap-3 mt-3 mt-lg-0">
                        <SearchBar />
                        <NotificationBell />

                        {/* ВЫПАДАЮЩИЙ СПИСОК ПРОФИЛЯ */}
                        <div className="dropdown ms-lg-2">
                            <div
                                className="d-flex align-items-center gap-2 ps-3 dropdown-toggle text-white"
                                role="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                                style={{
                                    cursor: 'pointer',
                                    borderLeft: '1px solid rgba(255,255,255,0.2)',
                                    textDecoration: 'none'
                                }}
                            >
                                <div className="text-end d-none d-sm-block">
                                    <div style={{ fontSize: '13px', fontWeight: '700', lineHeight: '1.2' }}>{user?.name}</div>
                                    <div style={{ fontSize: '11px', opacity: '0.8' }}>{user?.role}</div>
                                </div>
                                <div className="bg-white rounded-circle d-flex align-items-center justify-content-center text-primary fw-bold shadow-sm"
                                     style={{ width: '36px', height: '36px', fontSize: '14px' }}>
                                    {user?.name?.charAt(0)}
                                </div>
                            </div>

                            <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2" style={{ borderRadius: '10px' }}>
                                <li>
                                    <Link className="dropdown-item py-2 d-flex align-items-center gap-2" to="/profile">
                                        <i className="bi bi-person-circle"></i> Мой профиль
                                    </Link>
                                </li>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                    <button
                                        className="dropdown-item py-2 d-flex align-items-center gap-2 text-danger"
                                        onClick={handleLogout}
                                    >
                                        <i className="bi bi-box-arrow-right"></i> Выйти из аккаунта
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar