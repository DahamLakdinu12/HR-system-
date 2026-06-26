import { ArrowLeft, ArrowRight, RefreshCw, Search, Users } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { searchEmployees } from '../services/api/employees';
import { Employee, EmployeeSearchResult } from '../types/employee';

const pageSize = 25;
type SortField = 'employee' | 'payCode' | 'designation' | 'grade' | 'location' | 'incrementDate' | 'currentSalary';
type SortDirection = 'asc' | 'desc';

const sortFields: SortField[] = ['employee', 'payCode', 'designation', 'grade', 'location', 'incrementDate', 'currentSalary'];

const columnLabels: Record<SortField, string> = {
  employee: 'Employee',
  payCode: 'Pay code',
  designation: 'Designation',
  grade: 'Grade',
  location: 'Location',
  incrementDate: 'Increment date',
  currentSalary: 'Current salary',
};

function cleanText(value: string | null | undefined) {
  const text = (value ?? '').trim();
  if (!text || ['n/a', 'na', 'null', '-'].includes(text.toLowerCase())) return '';
  return text;
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

function getEmployeeName(employee: Employee) {
  return cleanText(employee.fullName) || cleanText(employee.employeeNumber) || cleanText(employee.payCode) || 'Employee';
}

function getSortValue(employee: Employee, sortField: SortField) {
  switch (sortField) {
    case 'employee':
      return getEmployeeName(employee);
    case 'payCode':
      return cleanText(employee.payCode);
    case 'designation':
      return cleanText(employee.designation);
    case 'grade':
      return cleanText(employee.grade);
    case 'location':
      return cleanText(employee.location);
    case 'incrementDate':
      return employee.incrementDate;
    case 'currentSalary':
      return employee.currentSalary;
    default:
      return getEmployeeName(employee);
  }
}

function sortEmployees(employees: Employee[], sortField: SortField, sortDirection: SortDirection) {
  const multiplier = sortDirection === 'asc' ? 1 : -1;
  return [...employees].sort((left, right) => {
    if (sortField === 'employee') {
      const leftName = cleanText(left.fullName);
      const rightName = cleanText(right.fullName);

      if (!leftName && rightName) return 1;
      if (leftName && !rightName) return -1;
    }

    const leftValue = getSortValue(left, sortField);
    const rightValue = getSortValue(right, sortField);

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return (leftValue - rightValue) * multiplier;
    }

    return String(leftValue).localeCompare(String(rightValue), 'en', { numeric: true, sensitivity: 'base' }) * multiplier;
  });
}

function getExportedEmployeeResult(
  employees: Employee[],
  payCode: string,
  page: number,
  sortField: SortField,
  sortDirection: SortDirection,
): EmployeeSearchResult {
  const normalizedPayCode = payCode.trim().toLowerCase();
  const items = normalizedPayCode
    ? employees.filter((employee) => employee.payCode.toLowerCase().includes(normalizedPayCode))
    : employees;
  const sortedItems = sortEmployees(items, sortField, sortDirection);

  return {
    items: sortedItems.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    totalCount: sortedItems.length,
  };
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
  if (!value) return 'Not available';
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(value);
}

function initials(employee: Employee) {
  return getEmployeeName(employee)
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
  const sortFieldParam = params.get('sort');
  const sortField = sortFields.includes(sortFieldParam as SortField) ? sortFieldParam as SortField : 'employee';
  const sortDirection = params.get('direction') === 'desc' ? 'desc' : 'asc';

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

    searchEmployees({ payCode: payCode || undefined, sortBy: sortField, sortDirection, page, pageSize })
      .then((data) => {
        if (!ignore) setResult(data);
      })
      .catch(async () => {
        try {
          const employees = await loadExportedEmployees();
          if (!ignore) {
            setResult(getExportedEmployeeResult(employees, payCode, page, sortField, sortDirection));
            setUsingExport(true);
          }
        } catch {
          if (!ignore) setError('Unable to load employee data from HCM.');
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [page, payCode, sortDirection, sortField]);

  const totalPages = Math.max(1, Math.ceil((result?.totalCount ?? 0) / pageSize));
  const visibleEmployees = sortEmployees(result?.items ?? [], sortField, sortDirection);

  const updateRoute = (
    nextPayCode: string,
    nextPage = 1,
    nextSortField = sortField,
    nextSortDirection = sortDirection,
  ) => {
    const next = new URLSearchParams();
    if (nextPayCode.trim()) next.set('payCode', nextPayCode.trim());
    if (nextPage > 1) next.set('page', String(nextPage));
    if (nextSortField !== 'employee') next.set('sort', nextSortField);
    if (nextSortDirection !== 'asc') next.set('direction', nextSortDirection);
    navigate(`/employees${next.toString() ? `?${next}` : ''}`);
  };

  const updateSort = (nextSortField: SortField) => {
    const nextSortDirection = sortField === nextSortField && sortDirection === 'asc' ? 'desc' : 'asc';
    updateRoute(payCode, 1, nextSortField, nextSortDirection);
  };

  const renderSortableHeader = (field: SortField) => (
    <th>
      <button className="sortable-header" onClick={() => updateSort(field)} type="button">
        {columnLabels[field]}
        <span aria-hidden="true">{sortField === field ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
      </button>
    </th>
  );

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
                    {renderSortableHeader('employee')}
                    {renderSortableHeader('payCode')}
                    {renderSortableHeader('designation')}
                    {renderSortableHeader('grade')}
                    {renderSortableHeader('location')}
                    {renderSortableHeader('incrementDate')}
                    {renderSortableHeader('currentSalary')}
                  </tr>
                </thead>
                <tbody>
                  {visibleEmployees.map((employee, index) => (
                    <tr key={employee.employeeNumber}>
                      <td>
                        <span className={`table-avatar avatar-${index % 4}`}>{initials(employee)}</span>
                        <span>
                          <strong>{getEmployeeName(employee)}</strong>
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

            {visibleEmployees.length === 0 && (
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
