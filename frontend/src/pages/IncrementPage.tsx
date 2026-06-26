import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Calculator,
  CheckCircle2,
  FileText,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDueIncrements } from '../services/api/employees';
import { Employee } from '../types/employee';

type IncrementPeriod = 'next30' | 'next60' | 'thisMonth';

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
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
        incrementDate: cleanText(incrementDate),
        currentSalary: Number(currentSalary),
      };
    });
}

async function loadExportedEmployees() {
  const response = await fetch('/data/hcm-employees.psv');
  if (!response.ok) throw new Error('Employee export is unavailable.');
  return parseEmployeeExport(await response.text());
}

function getPeriodRange(period: IncrementPeriod) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (period === 'thisMonth') {
    return {
      from: today,
      to: new Date(today.getFullYear(), today.getMonth() + 1, 0),
      label: 'This month',
    };
  }

  const days = period === 'next30' ? 30 : 60;
  const to = new Date(today);
  to.setDate(today.getDate() + days);

  return {
    from: today,
    to,
    label: `Next ${days} days`,
  };
}

function getDaysUntil(dateValue: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(`${dateValue}T00:00:00`);
  return Math.ceil((dueDate.getTime() - today.getTime()) / 86_400_000);
}

function formatDate(value: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-LK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function formatMoney(value: number) {
  if (!value) return 'Pending';
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(value);
}

function estimateIncrement(employee: Employee) {
  if (!employee.currentSalary) return 0;
  return Math.round(employee.currentSalary * 0.04);
}

function initials(employee: Employee) {
  return getEmployeeName(employee)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'HR';
}

function filterRows(rows: Employee[], payCode: string) {
  const term = payCode.trim().toLowerCase();
  if (!term) return rows;
  return rows.filter((employee) => employee.payCode.toLowerCase().includes(term));
}

function sortRows(rows: Employee[]) {
  return [...rows].sort(
    (left, right) =>
      left.incrementDate.localeCompare(right.incrementDate) ||
      getEmployeeName(left).localeCompare(getEmployeeName(right), 'en', { sensitivity: 'base' }),
  );
}

export function IncrementPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<IncrementPeriod>('next30');
  const [payCodeInput, setPayCodeInput] = useState('');
  const [activePayCode, setActivePayCode] = useState('');
  const [rows, setRows] = useState<Employee[]>([]);
  const [selectedEmployeeNumber, setSelectedEmployeeNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingExport, setUsingExport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => getPeriodRange(period), [period]);

  useEffect(() => {
    let ignore = false;

    setLoading(true);
    setError(null);
    setUsingExport(false);

    getDueIncrements({
      from: toDateInput(range.from),
      to: toDateInput(range.to),
      page: 1,
      pageSize: 100,
    })
      .then((employees) => {
        if (ignore) return;
        const sortedRows = sortRows(employees);
        setRows(sortedRows);
        setSelectedEmployeeNumber(sortedRows[0]?.employeeNumber ?? null);
      })
      .catch(async () => {
        try {
          const employees = await loadExportedEmployees();
          if (ignore) return;

          const exportedRows = sortRows(
            employees.filter((employee) => employee.incrementDate >= toDateInput(range.from) && employee.incrementDate <= toDateInput(range.to)),
          );
          setRows(exportedRows);
          setSelectedEmployeeNumber(exportedRows[0]?.employeeNumber ?? null);
          setUsingExport(true);
        } catch {
          if (!ignore) setError('Unable to load increment records from HCM.');
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [range.from, range.to]);

  const visibleRows = filterRows(rows, activePayCode);
  const selectedEmployee = visibleRows.find((employee) => employee.employeeNumber === selectedEmployeeNumber) ?? visibleRows[0] ?? null;
  const readyCount = visibleRows.filter((employee) => getDaysUntil(employee.incrementDate) <= 14).length;
  const estimatedTotal = visibleRows.reduce((total, employee) => total + estimateIncrement(employee), 0);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setActivePayCode(payCodeInput.trim());
  };

  const handleRefresh = () => {
    setActivePayCode('');
    setPayCodeInput('');
    setPeriod((current) => current);
  };

  return (
    <main className="dashboard module-page increments-page">
      <button className="back-button" onClick={() => navigate('/dashboard')}><ArrowLeft size={16} /> Overview</button>

      <section className="module-hero increment-hero">
        <div>
          <span className="eyebrow">Increment processing</span>
          <h1>Increment page</h1>
          <p>{usingExport ? 'Processing queue loaded from the exported HCM employee records.' : 'Review upcoming increment records from the HCM database.'}</p>
        </div>
        <button className="primary-button" onClick={() => navigate('/assessments')}>
          <FileText size={16} /> Generate assessment
        </button>
      </section>

      <section className="stat-grid increment-stat-grid">
        <article className="stat-card"><div className="stat-card__icon mint"><Users /></div><div className="stat-card__meta"><span>Employees queued</span><strong>{visibleRows.length}</strong><small>{range.label}</small></div></article>
        <article className="stat-card"><div className="stat-card__icon amber"><CalendarDays /></div><div className="stat-card__meta"><span>Ready in 14 days</span><strong>{readyCount}</strong><small>needs review</small></div></article>
        <article className="stat-card"><div className="stat-card__icon violet"><Calculator /></div><div className="stat-card__meta"><span>Estimated increments</span><strong>{formatMoney(estimatedTotal)}</strong><small>temporary calculation</small></div></article>
        <article className="stat-card"><div className="stat-card__icon blue"><CheckCircle2 /></div><div className="stat-card__meta"><span>Status</span><strong>{usingExport ? 'Export' : 'Live'}</strong><small>HCM source</small></div></article>
      </section>

      <section className="increment-workspace">
        <article className="panel increment-list-panel">
          <div className="employee-toolbar">
            <form className="employee-search" onSubmit={handleSearch}>
              <Search size={17} />
              <input
                value={payCodeInput}
                onChange={(event) => setPayCodeInput(event.target.value)}
                placeholder="Search increment by pay code..."
                aria-label="Search increment by pay code"
              />
              <button type="submit">Search</button>
            </form>
            <label className="filter-button">
              <CalendarDays size={15} />
              <select value={period} onChange={(event) => setPeriod(event.target.value as IncrementPeriod)} aria-label="Increment period">
                <option value="next30">Next 30 days</option>
                <option value="next60">Next 60 days</option>
                <option value="thisMonth">This month</option>
              </select>
            </label>
            <button className="filter-button" onClick={handleRefresh}>
              <RefreshCw size={15} /> Reset
            </button>
          </div>

          {loading && <div className="employee-message">Loading increment records...</div>}
          {error && <div className="employee-message employee-message--error">{error}</div>}
          {usingExport && !loading && <div className="employee-message">Showing exported HCM records because the backend API is not available.</div>}

          {!loading && !error && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Employee</th><th>Pay code</th><th>Designation</th><th>Increment date</th><th>Current salary</th><th>Est. increment</th><th>Status</th><th /></tr>
                </thead>
                <tbody>
                  {visibleRows.map((employee, index) => {
                    const selected = selectedEmployee?.employeeNumber === employee.employeeNumber;
                    const daysLeft = getDaysUntil(employee.incrementDate);
                    return (
                      <tr key={employee.employeeNumber} className={selected ? 'increment-row increment-row--selected' : 'increment-row'}>
                        <td><span className={`table-avatar avatar-${index % 4}`}>{initials(employee)}</span><span><strong>{getEmployeeName(employee)}</strong><small>{employee.employeeNumber}</small></span></td>
                        <td>{employee.payCode || '-'}</td>
                        <td>{employee.designation || '-'}</td>
                        <td>{formatDate(employee.incrementDate)}</td>
                        <td><strong>{formatMoney(employee.currentSalary)}</strong></td>
                        <td><strong>{formatMoney(estimateIncrement(employee))}</strong></td>
                        <td><span className={daysLeft <= 14 ? 'status status--review' : 'status status--ready'}>{daysLeft <= 14 ? 'Review' : 'Scheduled'}</span></td>
                        <td><button className="text-button" onClick={() => setSelectedEmployeeNumber(employee.employeeNumber)}>Select</button></td>
                      </tr>
                    );
                  })}
                  {visibleRows.length === 0 && <tr><td colSpan={8}>No increment records found for this filter.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <aside className="panel increment-detail-panel">
          <div className="panel__header">
            <div>
              <h2>Increment preview</h2>
              <p>Gazette rules can be connected here next.</p>
            </div>
            <TrendingUp size={18} />
          </div>

          {selectedEmployee ? (
            <div className="increment-preview">
              <span className="table-avatar avatar-1">{initials(selectedEmployee)}</span>
              <h2>{getEmployeeName(selectedEmployee)}</h2>
              <p>{selectedEmployee.designation || 'Designation unavailable'}</p>

              <dl>
                <div><dt>Pay code</dt><dd>{selectedEmployee.payCode || '-'}</dd></div>
                <div><dt>Grade</dt><dd>{selectedEmployee.grade || '-'}</dd></div>
                <div><dt>Location</dt><dd>{selectedEmployee.location || selectedEmployee.department || '-'}</dd></div>
                <div><dt>Increment date</dt><dd>{formatDate(selectedEmployee.incrementDate)}</dd></div>
                <div><dt>Current salary</dt><dd>{formatMoney(selectedEmployee.currentSalary)}</dd></div>
                <div><dt>Estimated increment</dt><dd>{formatMoney(estimateIncrement(selectedEmployee))}</dd></div>
                <div><dt>Payable salary</dt><dd>{formatMoney(selectedEmployee.currentSalary + estimateIncrement(selectedEmployee))}</dd></div>
              </dl>

              <button className="primary-button" onClick={() => navigate(`/employees?payCode=${selectedEmployee.payCode || selectedEmployee.employeeNumber}`)}>
                Open employee <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <div className="employee-message">Select an employee to preview increment details.</div>
          )}
        </aside>
      </section>
    </main>
  );
}
