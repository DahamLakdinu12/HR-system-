import {
  ArrowRight, CalendarDays, ChevronDown, CircleCheck, ClipboardCheck,
  Clock3, FileText, SlidersHorizontal, TrendingUp, Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllDueIncrements, getDueIncrements, searchEmployees } from '../services/api/employees';
import { getIncrementWorkflows } from '../services/api/incrementWorkflows';
import { Employee } from '../types/employee';
import { IncrementWorkflow } from '../types/incrementWorkflow';
import { useDataSource } from '../context/DataSourceContext';
import { getEmployeeDataSourceLabel } from '../constants/dataSources';

type OverviewTab = 'summary' | 'upcoming';

type ProgressSummary = {
  completed: number;
  inReview: number;
  awaitingApproval: number;
  notStarted: number;
  total: number;
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

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
        presentBasicSalary: 0,
        presentPayableSalary: 0,
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
  const response = await fetch('/data/hr-staff-employees.psv');
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

function formatActivityTime(value: string | null | undefined) {
  if (!value) return 'Current session';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Current session';
  return new Intl.DateTimeFormat('en-LK', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function workflowActivityText(workflow: IncrementWorkflow) {
  if (workflow.status === 'Approved' || workflow.status === 'Finalized') {
    return 'increment was approved';
  }
  if (workflow.status === 'Rejected') {
    return 'increment was not approved';
  }
  if (workflow.status === 'PendingApproval') {
    return 'is waiting for approval';
  }
  if (workflow.status === 'PendingAssessment') {
    return 'was moved to assessment';
  }
  if (workflow.status === 'ReturnedToIncrement') {
    return 'was returned to increments';
  }
  return 'workflow was updated';
}

function initials(employee: Employee) {
  return getEmployeeName(employee)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'HR';
}

function getProgressRange(month: number) {
  const year = new Date().getFullYear();
  return {
    from: new Date(year, month, 1),
    to: new Date(year, month + 1, 0),
    label: `${MONTHS[month]} ${year}`,
  };
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { dataSource } = useDataSource();
  const sourceLabel = getEmployeeDataSourceLabel(dataSource);
  const [activeTab, setActiveTab] = useState<OverviewTab>('summary');
  const [progressMonth, setProgressMonth] = useState(() => new Date().getMonth());
  const [progress, setProgress] = useState<ProgressSummary>({
    completed: 0,
    inReview: 0,
    awaitingApproval: 0,
    notStarted: 0,
    total: 0,
  });
  const [totalEmployees, setTotalEmployees] = useState<number | null>(null);
  const [dueThisMonth, setDueThisMonth] = useState<Employee[]>([]);
  const [upcomingIncrements, setUpcomingIncrements] = useState<Employee[]>([]);
  const [upcomingTabRows, setUpcomingTabRows] = useState<Employee[]>([]);
  const [recentWorkflows, setRecentWorkflows] = useState<IncrementWorkflow[]>([]);
  const [usingExport, setUsingExport] = useState(false);

  useEffect(() => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const next14Days = new Date(today);
    next14Days.setDate(today.getDate() + 14);
    const next60Days = new Date(today);
    next60Days.setDate(today.getDate() + 60);

    searchEmployees({ page: 1, pageSize: 1 })
      .then((data) => setTotalEmployees(data.totalCount))
      .catch(() => setTotalEmployees(null));

    getAllDueIncrements({
      from: toDateInput(monthStart),
      to: toDateInput(monthEnd),
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

  useEffect(() => {
    let ignore = false;
    const range = getProgressRange(progressMonth);

    const loadProgress = async () => {
      try {
        const workflows = await getIncrementWorkflows();
        const dueEmployees: Employee[] = [];
        const pageSize = 200;
        for (let page = 1; ; page += 1) {
          const batch = await getDueIncrements({
            from: toDateInput(range.from),
            to: toDateInput(range.to),
            page,
            pageSize,
          });
          dueEmployees.push(...batch);
          if (batch.length < pageSize) break;
        }

        const fromValue = toDateInput(range.from);
        const toValue = toDateInput(range.to);
        const periodWorkflows = workflows.filter((workflow) =>
          workflow.incrementDate >= fromValue && workflow.incrementDate <= toValue);
        const latestWorkflows = [...periodWorkflows].sort((left, right) => {
          const leftDate = left.modifiedAtUtc ?? left.createdAtUtc;
          const rightDate = right.modifiedAtUtc ?? right.createdAtUtc;
          return new Date(rightDate).getTime() - new Date(leftDate).getTime();
        });
        const blockedKeys = new Set(
          periodWorkflows
            .filter((workflow) => !['Draft', 'ReturnedToIncrement'].includes(workflow.status))
            .map((workflow) => `${workflow.employeeNumber}|${workflow.incrementDate}`),
        );
        const notStarted = dueEmployees.filter((employee) =>
          employee.incrementDate &&
          !blockedKeys.has(`${employee.employeeNumber}|${employee.incrementDate}`)).length;
        const completed = periodWorkflows.filter((workflow) =>
          ['Approved', 'Finalized'].includes(workflow.status)).length;
        const inReview = periodWorkflows.filter((workflow) =>
          ['PendingAssessment', 'PendingApproval', 'Rejected'].includes(workflow.status)).length;
        const awaitingApproval = periodWorkflows.filter((workflow) =>
          workflow.status === 'PendingApproval').length;

        if (!ignore) {
          setProgress({
            completed,
            inReview,
            awaitingApproval,
            notStarted,
            total: completed + inReview + notStarted,
          });
          setRecentWorkflows(latestWorkflows.slice(0, 2));
        }
      } catch {
        if (!ignore) {
          setProgress({
            completed: 0,
            inReview: 0,
            awaitingApproval: 0,
            notStarted: 0,
            total: 0,
          });
          setRecentWorkflows([]);
        }
      }
    };

    void loadProgress();
    window.addEventListener('increment-workflow-updated', loadProgress);
    return () => {
      ignore = true;
      window.removeEventListener('increment-workflow-updated', loadProgress);
    };
  }, [dataSource, progressMonth]);

  const completionPercent = progress.total
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;
  const reviewPercent = progress.total
    ? (progress.inReview / progress.total) * 100
    : 0;
  const periodLabel = getProgressRange(progressMonth).label;

  return (
    <main className="dashboard">
      <section className="welcome-row">
        <div><span className="eyebrow">{new Intl.DateTimeFormat('en-LK', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date())}</span><h1>Good morning, Admin.</h1><p>Here’s what’s happening across your HR workspace today.</p></div>
        <button className="primary-button" onClick={() => navigate('/increments')}><TrendingUp size={18} /> Process increments</button>
      </section>

      <section className="stat-grid">
        <article className="stat-card"><div className="stat-card__icon mint"><Users /></div><div className="stat-card__meta"><span>Total employees</span><strong>{totalEmployees?.toLocaleString('en-LK') ?? '...'}</strong><small>from {sourceLabel}</small></div><button onClick={() => navigate('/employees')} aria-label="View employees">•••</button></article>
        <article className="stat-card"><div className="stat-card__icon amber"><CalendarDays /></div><div className="stat-card__meta"><span>Due this month</span><strong>{dueThisMonth.length}</strong><small><b>{upcomingIncrements.length}</b> in next 14 days</small></div><button onClick={() => navigate('/employees')} aria-label="View due increments">•••</button></article>
        <article className="stat-card"><div className="stat-card__icon violet"><ClipboardCheck /></div><div className="stat-card__meta"><span>Awaiting approval</span><strong>{progress.awaitingApproval}</strong><small><b>{progress.inReview}</b> in review</small></div><button onClick={() => navigate('/approvals')} aria-label="View approvals">•••</button></article>
        <article className="stat-card"><div className="stat-card__icon blue"><CircleCheck /></div><div className="stat-card__meta"><span>Completed</span><strong>{progress.completed}</strong><small className="positive">{completionPercent}% <em>{periodLabel.toLowerCase()}</em></small></div><button onClick={() => navigate('/reports')} aria-label="View reports">•••</button></article>
      </section>

      <section className="panel progress-panel">
        <div className="panel__header"><div><h2>Increment progress</h2><p>{progress.total} employees scheduled for this cycle</p></div><label className="filter-button"><SlidersHorizontal size={16} /><select value={progressMonth} onChange={(event) => setProgressMonth(Number(event.target.value))} aria-label="Progress month">{MONTHS.map((month, index) => <option key={month} value={index}>{month}</option>)}</select><ChevronDown size={14} /></label></div>
        <div className="progress-content"><div className="progress-stat"><strong>{completionPercent}%</strong><span>{periodLabel} completion</span></div><div className="progress-details"><div className="progress-bar"><span className="progress-bar__completed" style={{ width: `${completionPercent}%` }} /><span className="progress-bar__review" style={{ width: `${reviewPercent}%` }} /></div><div className="progress-legend"><span><i className="dot green" />{progress.completed} completed</span><span><i className="dot gold" />{progress.inReview} in review</span><span><i className="dot gray" />{progress.notStarted} not started</span><b>{progress.completed} of {progress.total}</b></div></div></div>
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
                {recentWorkflows.map((workflow) => (
                  <div className="activity" key={workflow.id}>
                    <span className={workflow.status === 'Approved' || workflow.status === 'Finalized' ? 'activity__icon mint' : workflow.status === 'Rejected' ? 'activity__icon amber' : 'activity__icon violet'}>
                      {workflow.status === 'Approved' || workflow.status === 'Finalized' ? <CircleCheck size={17} /> : <FileText size={17} />}
                    </span>
                    <div>
                      <p><strong>{workflow.employeeName || workflow.payCode}</strong> {workflowActivityText(workflow)}</p>
                      <small>{formatActivityTime(workflow.modifiedAtUtc ?? workflow.createdAtUtc)}</small>
                    </div>
                  </div>
                ))}
                {recentWorkflows.length === 0 && (
                  <div className="activity"><span className="activity__icon violet"><FileText size={17} /></span><div><p><strong>No workflow updates</strong> recorded for {periodLabel}</p><small>Current session</small></div></div>
                )}
                <div className="activity"><span className="activity__icon amber"><Clock3 size={17} /></span><div><p><strong>{progress.awaitingApproval}</strong> increment assessments waiting for approval</p><small>{periodLabel}</small></div></div>
                <div className="activity"><span className="activity__icon mint"><CircleCheck size={17} /></span><div><p><strong>{progress.completed}</strong> increments completed in this cycle</p><small>{periodLabel}</small></div></div>
                <div className="activity"><span className="activity__icon blue"><Users size={17} /></span><div><p><strong>{sourceLabel}</strong> loaded {totalEmployees?.toLocaleString('en-LK') ?? '...'} employee records</p><small>Current session</small></div></div>
              </div>
              <button className="activity-footer" onClick={() => navigate('/audit-logs')}>View activity log <ArrowRight size={15} /></button>
            </article>
          </section>

        </>
      )}

      {activeTab === 'upcoming' && (
        <section className="panel upcoming-tab-panel">
          <div className="panel__header">
            <div>
              <h2>Upcoming increment</h2>
              <p>{usingExport ? 'Showing upcoming increment dates from the exported HR staff records.' : `Employees scheduled from ${sourceLabel} in the next 60 days.`}</p>
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
