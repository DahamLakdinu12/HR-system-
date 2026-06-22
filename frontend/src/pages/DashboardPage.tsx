import {
  ArrowRight, Bell, CalendarDays, ChevronDown, CircleCheck, ClipboardCheck,
  Clock3, FileText, HelpCircle, LayoutDashboard, LogOut, Menu, Search,
  Settings, SlidersHorizontal, TrendingUp, UserRound, Users, WalletCards, X,
} from 'lucide-react';
import { useState } from 'react';
import { Logo } from '../components/common/Logo';

type DashboardPageProps = { onLogout: () => void };

const navItems = [
  { icon: LayoutDashboard, label: 'Overview' },
  { icon: Users, label: 'Employees' },
  { icon: TrendingUp, label: 'Increments', badge: '12' },
  { icon: WalletCards, label: 'Salary scales' },
  { icon: ClipboardCheck, label: 'Assessments' },
  { icon: CircleCheck, label: 'Approvals', badge: '5' },
  { icon: FileText, label: 'Reports' },
];

const increments = [
  { initials: 'NK', name: 'Nadeesha Kumari', id: 'EMP-0142', department: 'Finance', date: '28 Jun 2026', amount: 'LKR 8,450', status: 'Ready' },
  { initials: 'AT', name: 'Amal Tharanga', id: 'EMP-0284', department: 'Operations', date: '30 Jun 2026', amount: 'LKR 6,200', status: 'Review' },
  { initials: 'SP', name: 'Shalini Perera', id: 'EMP-0097', department: 'Human Resources', date: '02 Jul 2026', amount: 'LKR 9,100', status: 'Ready' },
  { initials: 'DM', name: 'Dilan Madushanka', id: 'EMP-0311', department: 'Technology', date: '04 Jul 2026', amount: 'LKR 7,800', status: 'Pending' },
];

export function DashboardPage({ onLogout }: DashboardPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__top"><Logo /><button className="mobile-close" onClick={() => setMenuOpen(false)}><X size={20} /></button></div>
        <nav>
          <p className="nav-label">Workspace</p>
          {navItems.map(({ icon: Icon, label, badge }, index) => (
            <button className={`nav-item ${index === 0 ? 'nav-item--active' : ''}`} key={label}>
              <Icon size={19} /><span>{label}</span>{badge && <b>{badge}</b>}
            </button>
          ))}
          <p className="nav-label nav-label--second">Manage</p>
          <button className="nav-item"><UserRound size={19} /><span>Users & roles</span></button>
          <button className="nav-item"><Settings size={19} /><span>Settings</span></button>
        </nav>
        <div className="sidebar__help">
          <HelpCircle size={21} />
          <div><strong>Need a hand?</strong><span>Visit help centre</span></div>
          <ArrowRight size={16} />
        </div>
        <button className="user-card" onClick={onLogout}>
          <span className="avatar">KS</span>
          <span><strong>Kavindi Silva</strong><small>HR Administrator</small></span>
          <LogOut size={17} />
        </button>
      </aside>
      {menuOpen && <button className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}

      <div className="main-area">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenuOpen(true)}><Menu size={21} /></button>
          <div className="search"><Search size={18} /><input placeholder="Search employees, assessments..." /><kbd>⌘ K</kbd></div>
          <div className="topbar__actions">
            <button className="icon-button"><Bell size={20} /><i /></button>
            <span className="topbar__divider" />
            <button className="profile-button"><span className="avatar">KS</span><span>Kavindi Silva</span><ChevronDown size={15} /></button>
          </div>
        </header>

        <main className="dashboard">
          <section className="welcome-row">
            <div><span className="eyebrow">Monday, 22 June</span><h1>Good morning, Kavindi.</h1><p>Here’s what’s happening across your HR workspace today.</p></div>
            <button className="primary-button"><TrendingUp size={18} /> Process increments</button>
          </section>

          <section className="stat-grid">
            <article className="stat-card"><div className="stat-card__icon mint"><Users /></div><div className="stat-card__meta"><span>Total employees</span><strong>1,248</strong><small className="positive">↑ 2.4% <em>from last month</em></small></div><button>•••</button></article>
            <article className="stat-card"><div className="stat-card__icon amber"><CalendarDays /></div><div className="stat-card__meta"><span>Due this month</span><strong>84</strong><small><b>12</b> need attention</small></div><button>•••</button></article>
            <article className="stat-card"><div className="stat-card__icon violet"><ClipboardCheck /></div><div className="stat-card__meta"><span>Awaiting approval</span><strong>27</strong><small><b>5</b> overdue</small></div><button>•••</button></article>
            <article className="stat-card"><div className="stat-card__icon blue"><CircleCheck /></div><div className="stat-card__meta"><span>Completed</span><strong>156</strong><small className="positive">↑ 18 <em>this month</em></small></div><button>•••</button></article>
          </section>

          <section className="dashboard-grid">
            <article className="panel increments-panel">
              <div className="panel__header"><div><h2>Upcoming increments</h2><p>Employees scheduled in the next 14 days</p></div><button className="text-button">View all <ArrowRight size={16} /></button></div>
              <div className="table-wrap"><table><thead><tr><th>Employee</th><th>Department</th><th>Due date</th><th>Increment</th><th>Status</th><th /></tr></thead><tbody>
                {increments.map((row, index) => <tr key={row.id}><td><span className={`table-avatar avatar-${index}`}>{row.initials}</span><span><strong>{row.name}</strong><small>{row.id}</small></span></td><td>{row.department}</td><td>{row.date}</td><td><strong>{row.amount}</strong></td><td><span className={`status status--${row.status.toLowerCase()}`}>{row.status}</span></td><td><button className="more-button">•••</button></td></tr>)}
              </tbody></table></div>
            </article>

            <article className="panel activity-panel">
              <div className="panel__header"><div><h2>Recent activity</h2><p>Latest updates from your team</p></div><button className="more-button">•••</button></div>
              <div className="activity-list">
                <div className="activity"><span className="activity__icon mint"><CircleCheck size={17} /></span><div><p><strong>You approved</strong> 8 increment assessments</p><small>12 minutes ago</small></div></div>
                <div className="activity"><span className="activity__icon violet"><FileText size={17} /></span><div><p><strong>Ruwan Jayasinghe</strong> generated an assessment form</p><small>1 hour ago</small></div></div>
                <div className="activity"><span className="activity__icon amber"><Clock3 size={17} /></span><div><p><strong>5 assessments</strong> were submitted for your review</p><small>3 hours ago</small></div></div>
                <div className="activity"><span className="activity__icon blue"><Users size={17} /></span><div><p>HCM employee data sync completed successfully</p><small>Yesterday, 4:35 PM</small></div></div>
              </div>
              <button className="activity-footer">View activity log <ArrowRight size={15} /></button>
            </article>
          </section>

          <section className="panel progress-panel">
            <div className="panel__header"><div><h2>June increment progress</h2><p>84 employees scheduled for this cycle</p></div><button className="filter-button"><SlidersHorizontal size={16} /> This month <ChevronDown size={14} /></button></div>
            <div className="progress-content"><div className="progress-stat"><strong>68%</strong><span>Overall completion</span></div><div className="progress-details"><div className="progress-bar"><span /></div><div className="progress-legend"><span><i className="dot green" />57 completed</span><span><i className="dot gold" />15 in review</span><span><i className="dot gray" />12 not started</span><b>57 of 84</b></div></div></div>
          </section>
        </main>
      </div>
    </div>
  );
}
