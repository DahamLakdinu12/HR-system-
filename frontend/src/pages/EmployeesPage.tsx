import { ArrowLeft, ArrowRight, RefreshCw, Search, Users } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { searchEmployees } from '../services/api/employees';
import { Employee, EmployeeSearchResult } from '../types/employee';

const pageSize = 25;

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
        employeeNumber,
        payCode,
        fullName,
        designation,
        grade,
        department,
        location,
        appointmentDate,
        promotionDate: promotionDate || null,
        incrementDate,
        currentSalary: Number(currentSalary),
      };
    });
}

async function loadExportedEmployees() {
  const response = await fetch('/data/hcm-employees.psv');
  if (!response.ok) throw new Error('Employee export is unavailable.');
  return parseEmployeeExport(await response.text());
}

function getExportedEmployeeResult(employees: Employee[], payCode: string, page: number): EmployeeSearchResult {
  const normalizedPayCode = payCode.trim().toLowerCase();
  const items = normalizedPayCode
    ? employees.filter((employee) => employee.payCode.toLowerCase().includes(normalizedPayCode))
    : employees;

  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    totalCount: items.length,
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-LK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function formatMoney(value: number) {
  if (!value) return 'Not available';
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(value);
}

function initials(employee: Employee) {
  return employee.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'HR';
}

export function EmployeesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const payCode = params.get('payCode') ?? '';
  const page = Math.max(1, Number(params.get('page') ?? 1));

  const [payCodeInput, setPayCodeInput] = useState(payCode);
  const [result, setResult] = useState<EmployeeSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingExport, setUsingExport] = useState(false);

  useEffect(() => {
    setPayCodeInput(payCode);
  }, [payCode]);

  useEffect(() => {
    let ignore = false;

    setLoading(true);
    setError(null);
    setUsingExport(false);

    searchEmployees({ payCode: payCode || undefined, page, pageSize })
      .then((data) => {
        if (!ignore) setResult(data);
      })
      .catch(async () => {
        const employees = await loadExportedEmployees();
        if (!ignore) {
          setResult(getExportedEmployeeResult(employees, payCode, page));
          setUsingExport(true);
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [page, payCode]);

  const totalPages = Math.max(1, Math.ceil((result?.totalCount ?? 0) / pageSize));

  const updateRoute = (nextPayCode: string, nextPage = 1) => {
    const next = new URLSearchParams();
    if (nextPayCode.trim()) next.set('payCode', nextPayCode.trim());
    if (nextPage > 1) next.set('page', String(nextPage));
    navigate(`/employees${next.toString() ? `?${next}` : ''}`);
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    updateRoute(payCodeInput);
  };

  return (
    <main className="dashboard module-page employees-page">
      <button className="back-button" onClick={() => navigate('/dashboard')}><ArrowLeft size={16} /> Overview</button>

      <section className="module-hero employee-hero">
        <div>
          <span className="eyebrow">HCM integration</span>
          <h1>Employees</h1>
          <p>{usingExport ? 'Showing records exported from the restored SQL Server HCM database.' : 'Live employee records restored from the SQL Server HCM database.'}</p>
        </div>
        <div className="employee-count">
          <Users size={18} />
          <span>{result?.totalCount ?? 0}</span>
          <small>records</small>
        </div>
      </section>

      <section className="panel employee-panel">
        <div className="employee-toolbar">
          <form className="employee-search" onSubmit={handleSearch}>
            <Search size={17} />
            <input
              value={payCodeInput}
              onChange={(event) => setPayCodeInput(event.target.value)}
              placeholder="Search by pay code..."
              aria-label="Search employees by pay code"
            />
            <button type="submit">Search</button>
          </form>
          <button className="filter-button" onClick={() => updateRoute(payCode, page)}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {error && <div className="employee-message employee-message--error">{error}</div>}
        {loading && <div className="employee-message">Loading HCM employees...</div>}
        {usingExport && !loading && (
          <div className="employee-message">Showing the latest exported HCM employee records. Pay code search is using restored database data.</div>
        )}

        {!loading && !error && (
          <>
            <div className="table-wrap">
              <table className="employee-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Pay code</th>
                    <th>Designation</th>
                    <th>Grade</th>
                    <th>Location</th>
                    <th>Increment date</th>
                    <th>Current salary</th>
                  </tr>
                </thead>
                <tbody>
                  {result?.items.map((employee, index) => (
                    <tr key={employee.employeeNumber}>
                      <td>
                        <span className={`table-avatar avatar-${index % 4}`}>{initials(employee)}</span>
                        <span>
                          <strong>{employee.fullName}</strong>
                          <small>{employee.employeeNumber}</small>
                        </span>
                      </td>
                      <td>{employee.payCode || '-'}</td>
                      <td>{employee.designation || '-'}</td>
                      <td>{employee.grade || '-'}</td>
                      <td>{employee.location || '-'}</td>
                      <td>{formatDate(employee.incrementDate)}</td>
                      <td><strong>{formatMoney(employee.currentSalary)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {result?.items.length === 0 && (
              <div className="employee-message">No matching employees were found.</div>
            )}

            <div className="employee-pagination">
              <span>Page {page} of {totalPages}</span>
              <div>
                <button disabled={page <= 1} onClick={() => updateRoute(payCode, page - 1)}>Previous</button>
                <button disabled={page >= totalPages} onClick={() => updateRoute(payCode, page + 1)}>
                  Next <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
