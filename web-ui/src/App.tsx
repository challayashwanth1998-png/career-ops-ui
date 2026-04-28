import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, ListTodo, Settings as SettingsIcon, Moon, Sun, Search } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import ScanPortals from './pages/ScanPortals';
import Tracker from './pages/Tracker';

export default function App() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <Router>
      <div className="app-container">
        {/* Sidebar */}
        <aside className="sidebar glass-panel">
          <div className="brand">
            <div style={{background: 'var(--accent)', color: 'white', borderRadius: '8px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px'}}>
              <LayoutDashboard size={20} />
            </div>
            career-ops-ui
          </div>
          
          <nav style={{display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px'}}>
            <NavLink to="/" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} /> Dashboard
            </NavLink>
            <NavLink to="/onboarding" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <SettingsIcon size={20} /> Onboarding
            </NavLink>
            <NavLink to="/scan" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Search size={20} /> Scan Portals
            </NavLink>
            <NavLink to="/tracker" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <ListTodo size={20} /> Application Tracker
            </NavLink>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <div className="topbar">
            <button className="theme-toggle" onClick={() => setIsDark(!isDark)} title="Toggle Theme">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
          
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/scan" element={<ScanPortals />} />
            <Route path="/tracker" element={<Tracker />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
