import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileSpreadsheet,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMonthlyReportSummary } from '../services/api/reports';
import { MonthlyReportSummary } from '../types/report';
import { useDataSource } from '../context/DataSourceContext';
import { getEmployeeDataSourceLabel } from '../constants/dataSources';

const months = Array.from({ length: 12 }, (_, monthIndex) => ({
  value: monthIndex + 1,
  label: new Intl.DateTimeFormat('en-LK', { month: 'long' })
    .format(new Date(2026, monthIndex, 1)),
}));

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function ReportsPage() {
  const navigate = useNavigate();
  const { dataSource } = useDataSource();
  const sourceLabel = getEmployeeDataSourceLabel(dataSource);
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [summary, setSummary] = useState<MonthlyReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const years = useMemo(
    () => Array.from({ length: 7 }, (_, index) => today.getFullYear() - 3 + index),
    [today],
  );

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await getMonthlyReportSummary({ year, month }));
    } catch {
      setError('Unable to load report data. Confirm that Docker and the backend API are running.');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  return (
    <main className="dashboard module-page reports-page">
      <button className="back-button" onClick={() => navigate('/dashboard')}><ArrowLeft size={16} /> Overview</button>
      <section className="module-hero reports-hero">
        <div>
          <span className="eyebrow">HR reporting</span>
          <h1>Reports</h1>
          <p>Generate monthly increment registers and approval decision reports from {sourceLabel}.</p>
        </div>
        <div className="report-period">
          <CalendarDays size={17} />
          <select value={month} onChange={(event) => setMonth(Number(event.target.value))} aria-label="Report month">
            {months.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
          </select>
          <select value={year} onChange={(event) => setYear(Number(event.target.value))} aria-label="Report year">
            {years.map((option) => <option value={option} key={option}>{option}</option>)}
          </select>
          <button onClick={() => void loadSummary()} aria-label="Refresh reports"><RefreshCw size={15} /></button>
        </div>
      </section>

      {error && <div className="workflow-message workflow-message--error">{error}</div>}
      {loading && <div className="employee-message">Loading monthly report data...</div>}

      {!loading && summary && (
        <>
          <section className="stat-grid report-stat-grid">
            <article className="stat-card"><div className="stat-card__icon blue"><FileSpreadsheet /></div><div className="stat-card__meta"><span>Increment employees</span><strong>{summary.incrementEmployees}</strong><small>{summary.monthLabel}</small></div></article>
            <article className="stat-card"><div className="stat-card__icon violet"><CalendarDays /></div><div className="stat-card__meta"><span>Total increments</span><strong>{formatMoney(summary.totalIncrementAmount)}</strong><small>monthly register</small></div></article>
            <article className="stat-card"><div className="stat-card__icon mint"><CheckCircle2 /></div><div className="stat-card__meta"><span>Accepted</span><strong>{summary.approvedEmployees}</strong><small>{summary.approvalRate.toFixed(1)}% approval rate</small></div></article>
            <article className="stat-card"><div className="stat-card__icon amber"><XCircle /></div><div className="stat-card__meta"><span>Declined</span><strong>{summary.declinedEmployees}</strong><small>retained for review</small></div></article>
          </section>
        </>
      )}
    </main>
  );
}
