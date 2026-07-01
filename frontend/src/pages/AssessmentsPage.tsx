import { ArrowLeft, ClipboardCheck, RefreshCw, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getIncrementWorkflows,
  notifyWorkflowUpdated,
  returnToIncrements,
} from '../services/api/incrementWorkflows';
import { IncrementWorkflow } from '../types/incrementWorkflow';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-LK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function AssessmentsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<IncrementWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await getIncrementWorkflows('assessments'));
    } catch {
      setError('Unable to load assessment workflows.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const handleReturn = async (row: IncrementWorkflow) => {
    setBusyId(row.id);
    setError(null);
    try {
      await returnToIncrements(row.id);
      setRows((current) => current.filter((item) => item.id !== row.id));
      notifyWorkflowUpdated();
    } catch {
      setError('The employee could not be returned to the increment queue.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="dashboard module-page workflow-page">
      <button className="back-button" onClick={() => navigate('/dashboard')}><ArrowLeft size={16} /> Overview</button>
      <section className="module-hero workflow-hero">
        <div>
          <span className="eyebrow">Performance assessment</span>
          <h1>Assessment queue</h1>
          <p>Employees moved from increments and their current approval status.</p>
        </div>
        <div className="workflow-count"><ClipboardCheck size={20} /><strong>{rows.length}</strong><span>Assessments</span></div>
      </section>

      <section className="panel workflow-panel">
        <div className="panel__header">
          <div><h2>Employee assessments</h2><p>Rejected records remain here until returned to increments.</p></div>
          <button className="filter-button" onClick={() => void loadRows()} disabled={loading}><RefreshCw size={14} /> Refresh</button>
        </div>
        {error && <div className="employee-message employee-message--error">{error}</div>}
        {loading && <div className="employee-message">Loading assessment workflows...</div>}
        {!loading && (
          <div className="table-wrap">
            <table className="workflow-table">
              <thead><tr><th>Employee</th><th>Grade</th><th>Increment date</th><th>Increment</th><th>Payable salary</th><th>Status</th><th /></tr></thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id}>
                    <td><span className={`table-avatar avatar-${index % 4}`}>{row.employeeName.split(' ').slice(0, 2).map((part) => part[0]).join('')}</span><span><strong>{row.employeeName}</strong><small>{row.payCode} · {row.designation}</small></span></td>
                    <td>{row.grade}</td>
                    <td>{formatDate(row.incrementDate)}</td>
                    <td><strong>{formatMoney(row.incrementAmount)}</strong></td>
                    <td><strong>{formatMoney(row.payableSalary)}</strong></td>
                    <td><span className={row.status === 'Rejected' ? 'status status--review' : 'status status--pending'}>{row.status === 'Rejected' ? 'Not approved' : 'Waiting approval'}</span></td>
                    <td>{row.status === 'Rejected' && <button className="workflow-return-button" onClick={() => void handleReturn(row)} disabled={busyId === row.id}><RotateCcw size={14} /> {busyId === row.id ? 'Moving...' : 'Return to increments'}</button>}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={7}>No employees are currently in assessment.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
