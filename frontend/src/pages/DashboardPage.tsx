import {
  ArrowRight, CalendarDays, ChevronDown, CircleCheck, ClipboardCheck,
  Clock3, FileText, SlidersHorizontal, TrendingUp, Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDueIncrements, searchEmployees } from '../services/api/employees';
import { Employee } from '../types/employee';
import { useDataSource } from '../context/DataSourceContext';
import { getEmployeeDataSourceLabel } from '../constants/dataSources';

type OverviewTab = 'summary' | 'upcoming';

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-LK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function cleanText(value: string | null | undefined) {
  const text = (value ?? '').trim();
  if (!text || ['n/a', 'na', 'null', '-'].includes(text.toLowerCase())) return '';
  return text;
}

function getEmployeeName(employee: Employee) {
  return cleanText(employee.fullName) || cleanText(employee.employeeNumber) || cleanText(employee.payCode) || 'Employee';
}

function parseEmployeeExport(text: string): Employee[] {
  return text
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [
        employeeNumber,
        payCode,
        fullName,
        designation,
        grade,
        department,
        location,
        appointmentDate,
        promotionDate,
        incrementDate,
        currentSalary,
        incrementAmount,
        stagnationAllowance,
        salaryScale,
      ] = line.split('|');

      return {
        employeeNumber: cleanText(employeeNumber),
        payCode: cleanText(payCode),
        fullName: cleanText(fullName),
        designation: cleanText(designation),
        grade: cleanText(grade),
        department: cleanText(department),
        location: cleanText(location),
        appointmentDate: cleanText(appointmentDate),
        promotionDate: promotionDate || null,
        incrementDate: cleanText(incrementDate) || null,
        currentSalary: Number(currentSalary),
        salaryPoint: null,
        incrementAmount: Number(incrementAmount || 0),
        convertedSalary: 0,
        payableSalary: 0,
        stagnationAllowance: Number(stagnationAllowance || 0),
        salaryScale: cleanText(salaryScale),
        salaryConversionStatus: 'Unavailable',
      };
    });
}

async function loadExportedEmployees() {
  const response = await fetch('/data/hcm-employees.psv');
  if (!response.ok) throw new Error('Employee export is unavailable.');
  return parseEmployeeExport(await response.text());
}

function getEmployeesDueBetween(employees: Employee[], from: Date, to: Date) {
  const fromValue = toDateInput(from);
  const toValue = toDateInput(to);

  return employees
    .filter((employee) => employee.incrementDate && employee.incrementDate >= fromValue && employee.incrementDate <= toValue)
    .sort((left, right) => (left.incrementDate ?? '').localeCompare(right.incrementDate ?? '') || getEmployeeName(left).localeCompare(getEmployeeName(right)));
}

function getDaysUntil(dateValue: string | null) {
  if (!dateValue) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(`${dateValue}T00:00:00`);
  return Math.ceil((dueDate.getTime() - today.getTime()) / 86_400_000);
}

function initials(employee: Employee) {
  return getEmployeeName(employee)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'HR';
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { dataSource } = useDataSource();
  const sourceLabel = getEmployeeDataSourceLabel(dataSource);
  const [activeTab, setActiveTab] = useState<OverviewTab>('summary');
  const [period, setPeriod] = useState('This month');
  const [totalEmployees, setTotalEmployees] = useState<number | null>(null);
  const [dueThisMonth, setDueThisMonth] = useState<Employee[]>([]);
  const [upcomingIncrements, setUpcomingIncrements] = useState<Employee[]>([]);
  const [upcomingTabRows, setUpcomingTabRows] = useState<Employee[]>([]);
  const [usingExport, setUsingExport] = useState(false);

  useEffect(() => {
    const today = new Date();
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const next14Days = new Date(today);
    next14Days.setDate(today.getDate() + 14);
    const next60Days = new Date(today);
    next60Days.setDate(today.getDate() + 60);

    searchEmployees({ page: 1, pageSize: 1 })
      .then((data) => setTotalEmployees(data.totalCount))
      .catch(async () => {
        if (dataSource !== 'hcm') {
          setTotalEmployees(null);
          return;
        }
        try {
          const employees = await loadExportedEmployees();
          setTotalEmployees(employees.length);
          setDueThisMonth(getEmployeesDueBetween(employees, today, monthEnd));
          setUpcomingIncrements(getEmployeesDueBetween(employees, today, next14Days).slice(0, 4));
          setUpcomingTabRows(getEmployeesDueBetween(employees, today, next60Days).slice(0, 12));
          setUsingExport(true);
        } catch {
          setTotalEmployees(null);
        }
      });

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

    getDueIncrements({
      from: toDateInput(today),
      to: toDateInput(next60Days),
      page: 1,
      pageSize: 12,
    })
      .then((employees) => {
        setUpcomingTabRows(employees);
        setUsingExport(false);
      })
      .catch(() => undefined);
  }, [dataSource]);

  return (
    <main className="dashboard">
      <section className="welcome-row">
        <div><span className="eyebrow">{new Intl.DateTimeFormat('en-LK', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date())}</span><h1>Good morning, Kavindi.</h1><p>Here’s what’s happening across your HR workspace today.</p></div>
        <button className="primary-button" onClick={() => navigate('/increments')}><TrendingUp size={18} /> Process increments</button>
      </section>

      <section className="stat-grid">
        <article className="stat-card"><div className="stat-card__icon mint"><Users /></div><div className="stat-card__meta"><span>Total employees</span><strong>{totalEmployees?.toLocaleString('en-LK') ?? '...'}</strong><small>from {sourceLabel}</small></div><button onClick={() => navigate('/employees')} aria-label="View employees">•••</button></article>
        <article className="stat-card"><div className="stat-card__icon amber"><CalendarDays /></div><div className="stat-card__meta"><span>Due this month</span><strong>{dueThisMonth.length}</strong><small><b>{upcomingIncrements.length}</b> in next 14 days</small></div><button onClick={() => navigate('/employees')} aria-label="View due increments">•••</button></article>
        <article className="stat-card"><div className="stat-card__icon violet"><ClipboardCheck /></div><div className="stat-card__meta"><span>Awaiting approval</span><strong>27</strong><small><b>5</b> overdue</small></div><button onClick={() => navigate('/approvals')} aria-label="View approvals">•••</button></article>
        <article className="stat-card"><div className="stat-card__icon blue"><CircleCheck /></div><div className="stat-card__meta"><span>Completed</span><strong>156</strong><small className="positive">↑ 18 <em>this month</em></small></div><button onClick={() => navigate('/reports')} aria-label="View reports">•••</button></article>
      </section>

      <nav className="overview-tabs" aria-label="Overview sections">
        <button className={activeTab === 'summary' ? 'overview-tab overview-tab--active' : 'overview-tab'} onClick={() => setActiveTab('summary')} type="button">
          Workspace summary
        </button>
        <button className={activeTab === 'upcoming' ? 'overview-tab overview-tab--active' : 'overview-tab'} onClick={() => setActiveTab('upcoming')} type="button">
          Upcoming increment
          <span>{upcomingTabRows.length}</span>
        </button>
      </nav>

      {activeTab === 'summary' && (
        <>
          <section className="dashboard-grid">
            <article className="panel increments-panel">
              <div className="panel__header"><div><h2>Upcoming increments</h2><p>Employees scheduled in the next 14 days</p></div><button className="text-button" onClick={() => setActiveTab('upcoming')}>Open tab <ArrowRight size={16} /></button></div>
              <div className="table-wrap"><table><thead><tr><th>Employee</th><th>Department</th><th>Due date</th><th>Increment</th><th>Status</th><th /></tr></thead><tbody>
                {upcomingIncrements.map((row, index) => <tr key={row.employeeNumber}><td><span className={`table-avatar avatar-${index}`}>{initials(row)}</span><span><strong>{getEmployeeName(row)}</strong><small>{row.employeeNumber}</small></span></td><td>{row.department || row.location || '-'}</td><td>{formatDate(row.incrementDate)}</td><td><strong>Pending gazette</strong></td><td><span className="status status--ready">{sourceLabel}</span></td><td><button className="more-button" onClick={() => navigate(`/employees?payCode=${row.payCode || row.employeeNumber}`)} aria-label={`Open ${getEmployeeName(row)}`}>•••</button></td></tr>)}
                {upcomingIncrements.length === 0 && <tr><td colSpan={6}>No increments due in the next 14 days.</td></tr>}
              </tbody></table></div>
            </article>

            <article className="panel activity-panel">
              <div className="panel__header"><div><h2>Recent activity</h2><p>Latest updates from your team</p></div><button className="more-button" onClick={() => navigate('/audit-logs')} aria-label="View activity">•••</button></div>
              <div className="activity-list">
                <div className="activity"><span className="activity__icon mint"><CircleCheck size={17} /></span><div><p><strong>You approved</strong> 8 increment assessments</p><small>12 minutes ago</small></div></div>
                <div className="activity"><span className="activity__icon violet"><FileText size={17} /></span><div><p><strong>Ruwan Jayasinghe</strong> generated an assessment form</p><small>1 hour ago</small></div></div>
                <div className="activity"><span className="activity__icon amber"><Clock3 size={17} /></span><div><p><strong>5 assessments</strong> were submitted for your review</p><small>3 hours ago</small></div></div>
                <div className="activity"><span className="activity__icon blue"><Users size={17} /></span><div><p>{sourceLabel} employee data loaded successfully</p><small>Current session</small></div></div>
              </div>
              <button className="activity-footer" onClick={() => navigate('/audit-logs')}>View activity log <ArrowRight size={15} /></button>
            </article>
          </section>

          <section className="panel progress-panel">
            <div className="panel__header"><div><h2>Increment progress</h2><p>{dueThisMonth.length} employees scheduled for this cycle</p></div><label className="filter-button"><SlidersHorizontal size={16} /><select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Progress period"><option>This month</option><option>Last month</option><option>This quarter</option></select><ChevronDown size={14} /></label></div>
            <div className="progress-content"><div className="progress-stat"><strong>68%</strong><span>{period} completion</span></div><div className="progress-details"><div className="progress-bar"><span /></div><div className="progress-legend"><span><i className="dot green" />57 completed</span><span><i className="dot gold" />15 in review</span><span><i className="dot gray" />12 not started</span><b>57 of 84</b></div></div></div>
          </section>
        </>
      )}

      {activeTab === 'upcoming' && (
        <section className="panel upcoming-tab-panel">
          <div className="panel__header">
            <div>
              <h2>Upcoming increment</h2>
              <p>{usingExport ? 'Showing upcoming increment dates from the exported HCM records.' : `Employees scheduled from ${sourceLabel} in the next 60 days.`}</p>
            </div>
            <button className="text-button" onClick={() => navigate('/employees')}>Open employees <ArrowRight size={16} /></button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Employee</th><th>Pay code</th><th>Designation</th><th>Location</th><th>Increment date</th><th>Days left</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {upcomingTabRows.map((row, index) => {
                  const daysLeft = getDaysUntil(row.incrementDate);
                  return (
                    <tr key={row.employeeNumber}>
                      <td><span className={`table-avatar avatar-${index % 4}`}>{initials(row)}</span><span><strong>{getEmployeeName(row)}</strong><small>{row.employeeNumber}</small></span></td>
                      <td>{row.payCode || '-'}</td>
                      <td>{row.designation || '-'}</td>
                      <td>{row.location || row.department || '-'}</td>
                      <td>{formatDate(row.incrementDate)}</td>
                      <td><strong>{daysLeft === null ? '-' : (daysLeft <= 0 ? 'Due today' : `${daysLeft} days`)}</strong></td>
                      <td><span className="status status--ready">Ready</span></td>
                      <td><button className="more-button" onClick={() => navigate(`/employees?payCode=${row.payCode || row.employeeNumber}`)} aria-label={`Open ${getEmployeeName(row)}`}>•••</button></td>
                    </tr>
                  );
                })}
                {upcomingTabRows.length === 0 && <tr><td colSpan={8}>No upcoming increment records found.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
