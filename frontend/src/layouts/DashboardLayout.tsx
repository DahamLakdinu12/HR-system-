import {
  ArrowRight, Bell, ChevronDown, CircleCheck, ClipboardCheck, FileText,
  HelpCircle, LayoutDashboard, LogOut, Menu, Search, Settings, TrendingUp,
  UserRound, Users, WalletCards, X,
} from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Logo } from '../components/common/Logo';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
  { icon: Users, label: 'Employees', path: '/employees' },
  { icon: TrendingUp, label: 'Increments', path: '/increments', badge: '12' },
  { icon: WalletCards, label: 'Salary scales', path: '/salary-scales' },
  { icon: ClipboardCheck, label: 'Assessments', path: '/assessments' },
  { icon: CircleCheck, label: 'Approvals', path: '/approvals', badge: '5' },
  { icon: FileText, label: 'Reports', path: '/reports' },
];

export function DashboardLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  const signOut = () => {
    logout();
    navigate('/');
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    if (search.trim()) navigate(`/employees?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__top"><Logo /><button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={20} /></button></div>
        <nav>
          <p className="nav-label">Workspace</p>
          {navItems.map(({ icon: Icon, label, path, badge }) => (
            <NavLink className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`} to={path} key={label} onClick={() => setMenuOpen(false)}>
              <Icon size={19} /><span>{label}</span>{badge && <b>{badge}</b>}
            </NavLink>
          ))}
          <p className="nav-label nav-label--second">Manage</p>
          <NavLink className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`} to="/users"><UserRound size={19} /><span>Users & roles</span></NavLink>
          <NavLink className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`} to="/settings"><Settings size={19} /><span>Settings</span></NavLink>
        </nav>
        <button className="sidebar__help" onClick={() => window.location.assign('mailto:hr-support@company.lk?subject=HR%20system%20support')}>
          <HelpCircle size={21} />
          <span><strong>Need a hand?</strong><small>Contact HR support</small></span>
          <ArrowRight size={16} />
        </button>
        <button className="user-card" onClick={signOut} aria-label="Sign out">
          <span className="avatar">KS</span>
          <span><strong>Kavindi Silva</strong><small>HR Administrator</small></span>
          <LogOut size={17} />
        </button>
      </aside>
      {menuOpen && <button className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}

      <div className="main-area">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <form className="search" onSubmit={submitSearch}>
            <Search size={18} /><input ref={searchRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employees, assessments..." aria-label="Search" /><kbd>⌘ K</kbd>
          </form>
          <div className="topbar__actions">
            <div className="action-menu">
              <button className="icon-button" onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }} aria-label="Notifications"><Bell size={20} /><i /></button>
              {notificationsOpen && <div className="popover notification-popover"><strong>Notifications</strong><p>5 assessments need your approval.</p><button onClick={() => navigate('/approvals')}>Review approvals <ArrowRight size={14} /></button></div>}
            </div>
            <span className="topbar__divider" />
            <div className="action-menu">
              <button className="profile-button" onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }}><span className="avatar">KS</span><span>Kavindi Silva</span><ChevronDown size={15} /></button>
              {profileOpen && <div className="popover profile-popover"><button onClick={() => navigate('/settings')}><Settings size={15} /> Settings</button><button onClick={signOut}><LogOut size={15} /> Sign out</button></div>}
            </div>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
