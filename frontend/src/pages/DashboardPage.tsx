import {
  ArrowRight, CalendarDays, ChevronDown, CircleCheck, ClipboardCheck,
  Clock3, FileText, SlidersHorizontal, TrendingUp, Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDueIncrements, searchEmployees } from '../services/api/employees';
import { Employee } from '../types/employee';

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-LK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function initials(employee: Employee) {
  return employee.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'HR';
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('This month');
  const [totalEmployees, setTotalEmployees] = useState<number | null>(null);
  const [dueThisMonth, setDueThisMonth] = useState<Employee[]>([]);
  const [upcomingIncrements, setUpcomingIncrements] = useState<Employee[]>([]);

  useEffect(() => {
    const today = new Date();
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const next14Days = new Date(today);
    next14Days.setDate(today.getDate() + 14);

    searchEmployees({ page: 1, pageSize: 1 })
      .then((data) => setTotalEmployees(data.totalCount))
      .catch(() => setTotalEmployees(null));

    getDueIncrements({
      from: toDateInput(today),
      to: toDateInput(monthEnd),
      page: 1,
      pageSize: 200,
    })
      .then(setDueThisMonth)
      .catch(() => setDueThisMonth([]));

    getDueIncrements({
      from: toDateInput(today),
      to: toDateInput(next14Days),
      page: 1,
      pageSize: 4,
    })
      .then(setUpcomingIncrements)
      .catch(() => setUpcomingIncrements([]));
  }, []);

  return (
    <main className="dashboard">
      <section className="welcome-row">
        <div><span className="eyebrow">{new Intl.DateTimeFormat('en-LK', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date())}</span><h1>Good morning, Kavindi.</h1><p>Here’s what’s happening across your HR workspace today.</p></div>
        <button className="primary-button" onClick={() => navigate('/increments')}><TrendingUp size={18} /> Process increments</button>
      </section>

      <section className="stat-grid">
        <article className="stat-card"><div className="stat-card__icon mint"><Users /></div><div className="stat-card__meta"><span>Total employees</span><strong>{totalEmployees?.toLocaleString('en-LK') ?? '...'}</strong><small>from restored HCM</small></div><button onClick={() => navigate('/employees')} aria-label="View employees">•••</button></article>
        <article className="stat-card"><div className="stat-card__icon amber"><CalendarDays /></div><div className="stat-card__meta"><span>Due this month</span><strong>{dueThisMonth.length}</strong><small><b>{upcomingIncrements.length}</b> in next 14 days</small></div><button onClick={() => navigate('/employees')} aria-label="View due increments">•••</button></article>
        <article className="stat-card"><div className="stat-card__icon violet"><ClipboardCheck /></div><div className="stat-card__meta"><span>Awaiting approval</span><strong>27</strong><small><b>5</b> overdue</small></div><button onClick={() => navigate('/approvals')} aria-label="View approvals">•••</button></article>
        <article className="stat-card"><div className="stat-card__icon blue"><CircleCheck /></div><div className="stat-card__meta"><span>Completed</span><strong>156</strong><small className="positive">↑ 18 <em>this month</em></small></div><button onClick={() => navigate('/reports')} aria-label="View reports">•••</button></article>
      </section>

      <section className="dashboard-grid">
        <article className="panel increments-panel">
          <div className="panel__header"><div><h2>Upcoming increments</h2><p>Employees scheduled in the next 14 days</p></div><button className="text-button" onClick={() => navigate('/increments')}>View all <ArrowRight size={16} /></button></div>
          <div className="table-wrap"><table><thead><tr><th>Employee</th><th>Department</th><th>Due date</th><th>Increment</th><th>Status</th><th /></tr></thead><tbody>
            {upcomingIncrements.map((row, index) => <tr key={row.employeeNumber}><td><span className={`table-avatar avatar-${index}`}>{initials(row)}</span><span><strong>{row.fullName}</strong><small>{row.employeeNumber}</small></span></td><td>{row.department || row.location || '-'}</td><td>{formatDate(row.incrementDate)}</td><td><strong>Pending gazette</strong></td><td><span className="status status--ready">HCM</span></td><td><button className="more-button" onClick={() => navigate(`/employees?search=${row.employeeNumber}`)} aria-label={`Open ${row.fullName}`}>•••</button></td></tr>)}
            {upcomingIncrements.length === 0 && <tr><td colSpan={6}>No increments due in the next 14 days.</td></tr>}
          </tbody></table></div>
        </article>

        <article className="panel activity-panel">
          <div className="panel__header"><div><h2>Recent activity</h2><p>Latest updates from your team</p></div><button className="more-button" onClick={() => navigate('/audit-logs')} aria-label="View activity">•••</button></div>
          <div className="activity-list">
            <div className="activity"><span className="activity__icon mint"><CircleCheck size={17} /></span><div><p><strong>You approved</strong> 8 increment assessments</p><small>12 minutes ago</small></div></div>
            <div className="activity"><span className="activity__icon violet"><FileText size={17} /></span><div><p><strong>Ruwan Jayasinghe</strong> generated an assessment form</p><small>1 hour ago</small></div></div>
            <div className="activity"><span className="activity__icon amber"><Clock3 size={17} /></span><div><p><strong>5 assessments</strong> were submitted for your review</p><small>3 hours ago</small></div></div>
            <div className="activity"><span className="activity__icon blue"><Users size={17} /></span><div><p>HCM employee data sync completed successfully</p><small>Yesterday, 4:35 PM</small></div></div>
          </div>
          <button className="activity-footer" onClick={() => navigate('/audit-logs')}>View activity log <ArrowRight size={15} /></button>
        </article>
      </section>

      <section className="panel progress-panel">
        <div className="panel__header"><div><h2>Increment progress</h2><p>{dueThisMonth.length} employees scheduled for this cycle</p></div><label className="filter-button"><SlidersHorizontal size={16} /><select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Progress period"><option>This month</option><option>Last month</option><option>This quarter</option></select><ChevronDown size={14} /></label></div>
        <div className="progress-content"><div className="progress-stat"><strong>68%</strong><span>{period} completion</span></div><div className="progress-details"><div className="progress-bar"><span /></div><div className="progress-legend"><span><i className="dot green" />57 completed</span><span><i className="dot gold" />15 in review</span><span><i className="dot gray" />12 not started</span><b>57 of 84</b></div></div></div>
      </section>
    </main>
  );
}
