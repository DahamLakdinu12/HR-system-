import { ArrowLeft, Check, CircleCheck, RefreshCw, RotateCcw, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  approveIncrement,
  getIncrementWorkflows,
  notifyWorkflowUpdated,
  rejectIncrement,
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

export function ApprovalsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<IncrementWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await getIncrementWorkflows('approvals'));
    } catch {
      setError('Unable to load approval workflows.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const transition = async (row: IncrementWorkflow, approved: boolean) => {
    setBusyId(row.id);
    setError(null);
    setMessage(null);
    try {
      if (approved) {
        await approveIncrement(row.id);
        setMessage(row.isStagnationIncrement
          ? `${row.employeeName}'s stagnation increment was approved.`
          : `${row.employeeName} was approved and advanced to the next salary point.`);
      } else {
        await rejectIncrement(row.id);
        setMessage(`${row.employeeName} was not approved and remains in the assessment queue.`);
      }
      setRows((current) => current.filter((item) => item.id !== row.id));
      notifyWorkflowUpdated();
    } catch {
      setError(approved
        ? 'Approval failed because the employee salary record could not be updated.'
        : 'The workflow could not be marked as not approved.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReturn = async (row: IncrementWorkflow) => {
    setBusyId(row.id);
    setError(null);
    setMessage(null);
    try {
      await returnToIncrements(row.id);
      setRows((current) => current.filter((item) => item.id !== row.id));
      setMessage(`${row.employeeName} was returned to the increment queue.`);
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
          <span className="eyebrow">Authorization</span>
          <h1>Approval queue</h1>
          <p>Approve the salary step or retain the employee in assessment.</p>
        </div>
        <div className="workflow-count"><CircleCheck size={20} /><strong>{rows.length}</strong><span>Waiting</span></div>
      </section>

      {message && <div className="workflow-message workflow-message--success">{message}</div>}
      {error && <div className="workflow-message workflow-message--error">{error}</div>}

      <section className="panel workflow-panel">
        <div className="panel__header">
          <div><h2>Awaiting approval</h2><p>Approval updates the HR staff database and next increment date.</p></div>
          <button className="filter-button" onClick={() => void loadRows()} disabled={loading}><RefreshCw size={14} /> Refresh</button>
        </div>
        {loading && <div className="employee-message">Loading approval workflows...</div>}
        {!loading && (
          <div className="table-wrap">
            <table className="workflow-table approval-table">
              <thead><tr><th>Employee</th><th>Salary point</th><th>Current salary</th><th>Increment</th><th>Converted</th><th>Payable</th><th>Decision</th></tr></thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id}>
                    <td><span className={`table-avatar avatar-${index % 4}`}>{row.employeeName.split(' ').slice(0, 2).map((part) => part[0]).join('')}</span><span><strong>{row.employeeName}</strong><small>{row.payCode} · {row.grade} · {formatDate(row.incrementDate)}{row.isStagnationIncrement ? ' · Stagnation increment' : ''}</small></span></td>
                    <td>{row.salaryPoint}</td>
                    <td>{formatMoney(row.currentSalary)}</td>
                    <td><strong>{formatMoney(row.incrementAmount)}</strong></td>
                    <td>{formatMoney(row.convertedSalary)}</td>
                    <td><strong>{formatMoney(row.payableSalary)}</strong></td>
                    <td><div className="approval-actions"><button className="approval-button approval-button--return" onClick={() => void handleReturn(row)} disabled={busyId === row.id}><RotateCcw size={14} /> Return</button><button className="approval-button approval-button--reject" onClick={() => void transition(row, false)} disabled={busyId === row.id}><X size={14} /> Not approved</button><button className="approval-button approval-button--approve" onClick={() => void transition(row, true)} disabled={busyId === row.id}><Check size={14} /> Approve</button></div></td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={7}>No assessments are waiting for approval.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
