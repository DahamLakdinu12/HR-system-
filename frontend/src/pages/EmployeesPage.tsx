import { ArrowLeft, ArrowRight, Building2, CalendarDays, Edit3, MapPin, RefreshCw, Save, Search, UserRound, Users, WalletCards, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDepartments, searchEmployees, updateEmployee } from '../services/api/employees';
import { DepartmentSummary, Employee, EmployeeSearchResult } from '../types/employee';
import { useDataSource } from '../context/DataSourceContext';
import { getEmployeeDataSourceLabel } from '../constants/dataSources';

const pageSize = 25;
type SortField = 'employee' | 'payCode' | 'designation' | 'grade' | 'department' | 'location' | 'incrementDate' | 'currentSalary';
type SortDirection = 'asc' | 'desc';
type EmployeeEditForm = {
  designation: string;
  grade: string;
  department: string;
  location: string;
  appointmentDate: string;
  promotionDate: string;
  nextIncrementDate: string;
};

const sortFields: SortField[] = ['employee', 'payCode', 'designation', 'grade', 'department', 'location', 'incrementDate', 'currentSalary'];

const columnLabels: Record<SortField, string> = {
  employee: 'Employee',
  payCode: 'Pay code',
  designation: 'Designation',
  grade: 'Grade',
  department: 'Department',
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

function getExportedDepartments(employees: Employee[]): DepartmentSummary[] {
  const counts = new Map<string, number>();

  employees.forEach((employee) => {
    const department = cleanText(employee.department) || 'Unassigned';
    counts.set(department, (counts.get(department) ?? 0) + 1);
  });

  return Array.from(counts, ([name, employeeCount]) => ({ name, employeeCount }))
    .sort((left, right) => {
      if (left.name === 'Unassigned') return 1;
      if (right.name === 'Unassigned') return -1;
      return left.name.localeCompare(right.name, 'en', { sensitivity: 'base' });
    });
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
    case 'department':
      return cleanText(employee.department);
    case 'location':
      return cleanText(employee.location);
    case 'incrementDate':
      return employee.incrementDate ?? '';
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
  department: string,
  page: number,
  sortField: SortField,
  sortDirection: SortDirection,
): EmployeeSearchResult {
  const normalizedPayCode = payCode.trim().toLowerCase();
  const payCodeMatches = normalizedPayCode
    ? employees.filter((employee) => employee.payCode.toLowerCase().includes(normalizedPayCode))
    : employees;
  const normalizedDepartment = department.trim().toLowerCase();
  const items = normalizedDepartment
    ? payCodeMatches.filter((employee) => {
        const employeeDepartment = cleanText(employee.department) || 'Unassigned';
        return employeeDepartment.toLowerCase() === normalizedDepartment;
      })
    : payCodeMatches;
  const sortedItems = sortEmployees(items, sortField, sortDirection);

  return {
    items: sortedItems.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    totalCount: sortedItems.length,
  };
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-LK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function toDateField(value: string | null) {
  return value ? value.slice(0, 10) : '';
}

function deriveIncrementDate(baseDate: string) {
  if (!baseDate) return '';
  const [, month, day] = baseDate.split('-');
  const year = new Date().getFullYear();
  return `${year}-${month}-${day}`;
}

function getEditForm(employee: Employee): EmployeeEditForm {
  return {
    designation: employee.designation,
    grade: employee.grade,
    department: employee.department,
    location: employee.location,
    appointmentDate: toDateField(employee.appointmentDate),
    promotionDate: toDateField(employee.promotionDate),
    nextIncrementDate: toDateField(employee.incrementDate),
  };
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
  const { dataSource } = useDataSource();
  const sourceLabel = getEmployeeDataSourceLabel(dataSource);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const activeTab = params.get('view') === 'departments' ? 'departments' : 'employees';
  const payCode = params.get('payCode') ?? '';
  const department = params.get('department') ?? '';
  const page = Math.max(1, Number(params.get('page') ?? 1));
  const sortFieldParam = params.get('sort');
  const sortField = sortFields.includes(sortFieldParam as SortField) ? sortFieldParam as SortField : 'employee';
  const sortDirection = params.get('direction') === 'desc' ? 'desc' : 'asc';

  const [payCodeInput, setPayCodeInput] = useState(payCode);
  const [result, setResult] = useState<EmployeeSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingExport, setUsingExport] = useState(false);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);
  const [departmentsUsingExport, setDepartmentsUsingExport] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [previewEmployee, setPreviewEmployee] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState<EmployeeEditForm | null>(null);
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    setPayCodeInput(payCode);
  }, [payCode]);

  useEffect(() => {
    if (!previewEmployee) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPreviewEmployee(null);
        setEditForm(null);
        setEditError(null);
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewEmployee]);

  useEffect(() => {
    let ignore = false;

    setLoading(true);
    setError(null);
    setUsingExport(false);

    searchEmployees({
      payCode: payCode || undefined,
      department: department || undefined,
      sortBy: sortField,
      sortDirection,
      page,
      pageSize,
    })
      .then((data) => {
        if (!ignore) setResult(data);
      })
      .catch(() => {
        if (!ignore) setError('Unable to load employee data from the HR staff database.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [dataSource, department, page, payCode, refreshKey, sortDirection, sortField]);

  useEffect(() => {
    let ignore = false;
    setDepartmentsLoading(true);
    setDepartmentsError(null);
    setDepartmentsUsingExport(false);

    getDepartments()
      .then((data) => {
        if (!ignore) setDepartments(data);
      })
      .catch(() => {
        if (!ignore) setDepartmentsError('Unable to load departments from the HR staff database.');
      })
      .finally(() => {
        if (!ignore) setDepartmentsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [dataSource, refreshKey]);

  const totalPages = Math.max(1, Math.ceil((result?.totalCount ?? 0) / pageSize));
  const visibleEmployees = sortEmployees(result?.items ?? [], sortField, sortDirection);
  const normalizedDepartmentSearch = departmentSearch.trim().toLowerCase();
  const visibleDepartments = departments.filter((department) =>
    department.name.toLowerCase().includes(normalizedDepartmentSearch));
  const departmentEmployeeTotal = departments.reduce(
    (total, department) => total + department.employeeCount,
    0,
  );

  const updateRoute = (
    nextPayCode: string,
    nextPage = 1,
    nextSortField = sortField,
    nextSortDirection = sortDirection,
  ) => {
    const next = new URLSearchParams();
    if (department) next.set('department', department);
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

  const closePreview = () => {
    setPreviewEmployee(null);
    setEditForm(null);
    setEditError(null);
  };

  const startEditing = (employee: Employee) => {
    setEditForm(getEditForm(employee));
    setEditError(null);
  };

  const updateEditField = (field: keyof EmployeeEditForm, value: string) => {
    setEditForm((current) => {
      if (!current) return current;
      if (field === 'promotionDate') {
        return {
          ...current,
          promotionDate: value,
          nextIncrementDate: deriveIncrementDate(value || current.appointmentDate),
        };
      }
      if (field === 'appointmentDate' && !current.promotionDate) {
        return {
          ...current,
          appointmentDate: value,
          nextIncrementDate: deriveIncrementDate(value),
        };
      }
      return { ...current, [field]: value };
    });
  };

  const handleSaveEmployee = async (event: FormEvent) => {
    event.preventDefault();
    if (!previewEmployee || !editForm) return;

    setSavingEmployee(true);
    setEditError(null);
    try {
      const updated = await updateEmployee(previewEmployee.employeeNumber, {
        designation: editForm.designation,
        grade: editForm.grade,
        department: editForm.department,
        location: editForm.location,
        appointmentDate: editForm.appointmentDate,
        promotionDate: editForm.promotionDate || null,
        nextIncrementDate: editForm.nextIncrementDate || null,
      });

      setPreviewEmployee(updated);
      setEditForm(null);
      setResult((current) => current
        ? {
            ...current,
            items: current.items.map((employee) =>
              employee.employeeNumber === updated.employeeNumber ? updated : employee),
          }
        : current);
      setRefreshKey((value) => value + 1);
    } catch {
      setEditError('Employee details could not be saved. Confirm HR staff database is selected and backend is running.');
    } finally {
      setSavingEmployee(false);
    }
  };

  const openDepartment = (departmentName: string) => {
    const next = new URLSearchParams({ department: departmentName });
    navigate(`/employees?${next}`);
  };

  return (
    <main className="dashboard module-page employees-page">
      <button className="back-button" onClick={() => navigate('/dashboard')}><ArrowLeft size={16} /> Overview</button>

      <section className="module-hero employee-hero">
        <div>
          <span className="eyebrow">{sourceLabel} integration</span>
          <h1>
            {activeTab === 'departments'
              ? 'Departments'
              : (department ? `${department} employees` : 'Employees')}
          </h1>
          <p>
            {activeTab === 'employees'
              ? (department
                  ? `Employees assigned to ${department === 'Unassigned' ? 'no recorded department' : department}.`
                  : (usingExport ? 'Showing exported HR staff records.' : `Live employee records from the ${sourceLabel} database.`))
              : (departmentsUsingExport ? 'Department totals from exported HR staff records.' : `Live department totals from the ${sourceLabel} database.`)}
          </p>
        </div>
        <div className="employee-count">
          {activeTab === 'employees' ? <Users size={18} /> : <Building2 size={18} />}
          <span>{activeTab === 'employees' ? (result?.totalCount ?? 0) : departments.length}</span>
          <small>{activeTab === 'employees' ? 'records' : 'departments'}</small>
        </div>
      </section>

      <nav className="overview-tabs employee-tabs" aria-label="Employee sections">
        <button
          className={activeTab === 'employees' ? 'overview-tab overview-tab--active' : 'overview-tab'}
          onClick={() => navigate('/employees')}
          type="button"
        >
          <Users size={14} /> All employees
          <span>{result?.totalCount ?? 0}</span>
        </button>
        <button
          className={activeTab === 'departments' ? 'overview-tab overview-tab--active' : 'overview-tab'}
          onClick={() => navigate('/employees?view=departments')}
          type="button"
        >
          <Building2 size={14} /> Departments
          <span>{departments.length}</span>
        </button>
      </nav>

      {activeTab === 'employees' && <section className="panel employee-panel">
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
          <button className="filter-button" onClick={() => setRefreshKey((value) => value + 1)}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {department && (
          <div className="employee-active-filter">
            <span><Building2 size={15} /> Department: <strong>{department}</strong></span>
            <button type="button" onClick={() => navigate('/employees')}>Clear filter</button>
          </div>
        )}

        {error && <div className="employee-message employee-message--error">{error}</div>}
        {loading && <div className="employee-message">Loading HR staff employees...</div>}
        {usingExport && !loading && (
          <div className="employee-message">Showing the latest exported HR staff employee records. Pay code search is using restored database data.</div>
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
                    {renderSortableHeader('department')}
                    {renderSortableHeader('location')}
                    {renderSortableHeader('incrementDate')}
                    {renderSortableHeader('currentSalary')}
                  </tr>
                </thead>
                <tbody>
                  {visibleEmployees.map((employee, index) => (
                    <tr
                      className="employee-row"
                      key={employee.employeeNumber}
                      onClick={() => setPreviewEmployee(employee)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setPreviewEmployee(employee);
                        }
                      }}
                      tabIndex={0}
                      aria-label={`View details for ${getEmployeeName(employee)}`}
                    >
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
                      <td>{employee.department || 'Unassigned'}</td>
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
      </section>}

      {activeTab === 'departments' && (
        <section className="panel employee-panel department-panel">
          <div className="employee-toolbar">
            <div className="employee-search">
              <Search size={17} />
              <input
                value={departmentSearch}
                onChange={(event) => setDepartmentSearch(event.target.value)}
                placeholder="Search departments..."
                aria-label="Search departments"
              />
            </div>
            <button className="filter-button" onClick={() => setRefreshKey((value) => value + 1)}>
              <RefreshCw size={15} /> Refresh
            </button>
          </div>

          {departmentsError && <div className="employee-message employee-message--error">{departmentsError}</div>}
          {departmentsLoading && <div className="employee-message">Loading HR staff departments...</div>}
          {departmentsUsingExport && !departmentsLoading && (
            <div className="employee-message">Showing department totals from the exported HR staff employee records.</div>
          )}

          {!departmentsLoading && !departmentsError && (
            <>
              <div className="table-wrap">
                <table className="employee-table department-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Employees</th>
                      <th>Share of workforce</th>
                      <th>Source</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleDepartments.map((department, index) => {
                      const share = departmentEmployeeTotal
                        ? Math.round((department.employeeCount / departmentEmployeeTotal) * 100)
                        : 0;

                      return (
                        <tr
                          className="department-row"
                          key={department.name}
                          onClick={() => openDepartment(department.name)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              openDepartment(department.name);
                            }
                          }}
                          tabIndex={0}
                          aria-label={`View employees in ${department.name}`}
                        >
                          <td>
                            <span className={`department-icon avatar-${index % 4}`}><Building2 size={15} /></span>
                            <span>
                              <strong>{department.name}</strong>
                              <small>{department.name === 'Unassigned' ? 'No department recorded' : `${sourceLabel} department`}</small>
                            </span>
                          </td>
                          <td><strong>{department.employeeCount.toLocaleString('en-LK')}</strong></td>
                          <td>
                            <div className="department-share">
                              <span><i style={{ width: `${share}%` }} /></span>
                              <strong>{share}%</strong>
                            </div>
                          </td>
                          <td><span className="status status--ready">{departmentsUsingExport ? 'Export' : sourceLabel}</span></td>
                          <td>
                            <button
                              className="department-open"
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openDepartment(department.name);
                              }}
                              aria-label={`Open ${department.name} employees`}
                            >
                              View <ArrowRight size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {visibleDepartments.length === 0 && (
                <div className="employee-message">No matching departments were found.</div>
              )}

              <div className="department-footer">
                <span>{visibleDepartments.length} of {departments.length} departments</span>
                <strong>{departmentEmployeeTotal.toLocaleString('en-LK')} employees represented</strong>
              </div>
            </>
          )}
        </section>
      )}

      {previewEmployee && (
        <div className="employee-preview-overlay" role="presentation" onMouseDown={closePreview}>
          <aside
            className="employee-preview-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-preview-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="employee-preview-header">
              <div>
                <span className="eyebrow">Employee preview</span>
                <h2 id="employee-preview-title">{getEmployeeName(previewEmployee)}</h2>
                <p>{previewEmployee.designation || 'Designation unavailable'}</p>
              </div>
              <div className="employee-preview-header-actions">
                <button
                  className="employee-preview-edit-button"
                  onClick={() => startEditing(previewEmployee)}
                  aria-label="Edit employee details"
                  type="button"
                >
                  <Edit3 size={15} /> Edit
                </button>
                <button onClick={closePreview} aria-label="Close employee preview" type="button"><X size={20} /></button>
              </div>
            </header>

            <div className="employee-preview-content">
              {editForm && (
                <form className="employee-edit-form" onSubmit={handleSaveEmployee}>
                  <div className="employee-edit-form__header">
                    <div>
                      <h3>Edit employee database</h3>
                      <p>Saving updates the HRStaff SQL table and recalculates the visible increment date from the database view.</p>
                    </div>
                    <button className="primary-button" disabled={savingEmployee} type="submit">
                      <Save size={15} /> {savingEmployee ? 'Saving...' : 'Save changes'}
                    </button>
                  </div>

                  {editError && <div className="employee-message employee-message--error">{editError}</div>}

                  <label>
                    Designation
                    <input value={editForm.designation} onChange={(event) => updateEditField('designation', event.target.value)} required />
                  </label>
                  <label>
                    Grade
                    <input value={editForm.grade} onChange={(event) => updateEditField('grade', event.target.value)} required />
                  </label>
                  <label>
                    Department
                    <input value={editForm.department} onChange={(event) => updateEditField('department', event.target.value)} />
                  </label>
                  <label>
                    Location
                    <input value={editForm.location} onChange={(event) => updateEditField('location', event.target.value)} />
                  </label>
                  <label>
                    Appointment date
                    <input type="date" value={editForm.appointmentDate} onChange={(event) => updateEditField('appointmentDate', event.target.value)} required />
                  </label>
                  <label>
                    Promotion date
                    <input type="date" value={editForm.promotionDate} onChange={(event) => updateEditField('promotionDate', event.target.value)} />
                  </label>
                  <label>
                    Next increment date
                    <input type="date" value={editForm.nextIncrementDate} onChange={(event) => updateEditField('nextIncrementDate', event.target.value)} />
                    <small>Changing promotion date auto-updates this date to the same day/month in the current year.</small>
                  </label>
                  <div className="employee-edit-form__actions">
                    <button className="secondary-button" onClick={() => setEditForm(null)} disabled={savingEmployee} type="button">Cancel</button>
                  </div>
                </form>
              )}

              <section className="employee-preview-identity">
                <span className="employee-preview-avatar">{initials(previewEmployee)}</span>
                <div><strong>{getEmployeeName(previewEmployee)}</strong><span>{previewEmployee.payCode || previewEmployee.employeeNumber}</span></div>
                <span className={previewEmployee.salaryConversionStatus === 'Applied' ? 'status status--ready' : 'status status--review'}>
                  {previewEmployee.salaryConversionStatus === 'Applied' ? 'Gazette applied' : previewEmployee.salaryConversionStatus}
                </span>
              </section>

              <section className="employee-preview-section">
                <h3><UserRound size={16} /> Employment</h3>
                <dl>
                  <div><dt>Employee number</dt><dd>{previewEmployee.employeeNumber || '-'}</dd></div>
                  <div><dt>Pay code</dt><dd>{previewEmployee.payCode || '-'}</dd></div>
                  <div><dt>Designation</dt><dd>{previewEmployee.designation || '-'}</dd></div>
                  <div><dt>Grade</dt><dd>{previewEmployee.grade || '-'}</dd></div>
                </dl>
              </section>

              <section className="employee-preview-section">
                <h3><MapPin size={16} /> Organization</h3>
                <dl>
                  <div><dt>Department</dt><dd>{previewEmployee.department || 'Unassigned'}</dd></div>
                  <div><dt>Location</dt><dd>{previewEmployee.location || '-'}</dd></div>
                  <div><dt>Data source</dt><dd>{sourceLabel}</dd></div>
                  <div><dt>Salary scale</dt><dd>{previewEmployee.salaryScale || '-'}</dd></div>
                </dl>
              </section>

              <section className="employee-preview-section">
                <h3><CalendarDays size={16} /> Important dates</h3>
                <dl>
                  <div><dt>Appointment date</dt><dd>{formatDate(previewEmployee.appointmentDate)}</dd></div>
                  <div><dt>Promotion date</dt><dd>{formatDate(previewEmployee.promotionDate)}</dd></div>
                  <div><dt>Next increment</dt><dd>{formatDate(previewEmployee.incrementDate)}</dd></div>
                </dl>
              </section>

              <section className="employee-preview-section employee-preview-section--salary">
                <h3><WalletCards size={16} /> Salary and increment</h3>
                <dl>
                  <div><dt>Salary point</dt><dd>{previewEmployee.salaryPoint ?? '-'}</dd></div>
                  <div><dt>Current salary</dt><dd>{formatMoney(previewEmployee.currentSalary)}</dd></div>
                  <div><dt>Increment amount</dt><dd>{formatMoney(previewEmployee.incrementAmount)}</dd></div>
                  <div><dt>Converted salary</dt><dd>{formatMoney(previewEmployee.convertedSalary)}</dd></div>
                  <div><dt>Payable salary</dt><dd>{formatMoney(previewEmployee.payableSalary)}</dd></div>
                  <div><dt>Stagnation allowance</dt><dd>{formatMoney(previewEmployee.stagnationAllowance)}</dd></div>
                </dl>
              </section>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
