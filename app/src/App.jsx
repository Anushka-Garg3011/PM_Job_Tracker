import { Routes, Route, NavLink } from 'react-router-dom'
import ResumePage from './pages/ResumePage.jsx'
import BoardPage from './pages/BoardPage.jsx'
import StatsPage from './pages/StatsPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">🎯</span>
          <span className="brand-name">JobTracker</span>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">📄</span> Resume
          </NavLink>
          <NavLink to="/board" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">📋</span> Board
          </NavLink>
          <NavLink to="/stats" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">📊</span> Stats
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">👤</span> Profile
          </NavLink>
        </nav>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<ResumePage />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>
    </div>
  )
}
