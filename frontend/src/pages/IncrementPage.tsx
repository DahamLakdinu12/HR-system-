import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  Printer,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDueIncrements } from '../services/api/employees';
import {
  AssessmentFormPayload,
  generateAssessmentForm,
  generateAssessmentForms,
} from '../services/api/increments';
import {
  getIncrementWorkflows,
  moveToAssessment,
  notifyWorkflowUpdated,
} from '../services/api/incrementWorkflows';
import { Employee } from '../types/employee';
import { useDataSource } from '../context/DataSourceContext';
import { getEmployeeDataSourceLabel } from '../constants/dataSources';

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toMonthInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

const incrementYear = new Date().getFullYear();
const incrementMonths = Array.from({ length: 12 }, (_, monthIndex) => {
  const date = new Date(incrementYear, monthIndex, 1);
  return {
    value: toMonthInput(date),
    label: new Intl.DateTimeFormat('en-LK', { month: 'long' }).format(date),
  };
});

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

function getMonthRange(monthValue: string) {
  const [yearValue, monthNumberValue] = monthValue.split('-').map(Number);
  const now = new Date();
  const year = Number.isInteger(yearValue) ? yearValue : now.getFullYear();
  const monthNumber = Number.isInteger(monthNumberValue) && monthNumberValue >= 1 && monthNumberValue <= 12
    ? monthNumberValue
    : now.getMonth() + 1;
  const from = new Date(year, monthNumber - 1, 1);
  const to = new Date(year, monthNumber, 0);
  return {
    from,
    to,
    label: new Intl.DateTimeFormat('en-LK', {
      month: 'long',
      year: 'numeric',
    }).format(from),
  };
}

function getDaysUntil(dateValue: string | null) {
  if (!dateValue) return Number.POSITIVE_INFINITY;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(`${dateValue}T00:00:00`);
  return Math.ceil((dueDate.getTime() - today.getTime()) / 86_400_000);
}

function formatDate(value: string | null) {
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

function getIncrementAmount(employee: Employee) {
  return employee.incrementAmount || 0;
}

function getPayableSalary(employee: Employee) {
  return employee.payableSalary || 0;
}

function getConversionLabel(employee: Employee) {
  switch (employee.salaryConversionStatus) {
    case 'Applied':
      return 'Gazette applied';
    case 'MaximumPoint':
      return 'Maximum point';
    case 'Unmatched':
      return 'Needs mapping';
    default:
      return 'Unavailable';
  }
}

function canGenerateAssessment(employee: Employee) {
  return employee.salaryConversionStatus === 'Applied';
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
      (left.incrementDate ?? '').localeCompare(right.incrementDate ?? '') ||
      getEmployeeName(left).localeCompare(getEmployeeName(right), 'en', { sensitivity: 'base' }),
  );
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function buildAssessmentPayload(employee: Employee): AssessmentFormPayload {
  if (!employee.incrementDate) throw new Error('An increment date is required to generate an assessment.');
  if (!canGenerateAssessment(employee)) {
    throw new Error(
      employee.salaryConversionStatus === 'MaximumPoint'
        ? 'This employee is at the maximum salary point and needs a stagnation allowance review.'
        : 'The employee salary does not match the assigned grade conversion table.',
    );
  }
  const incrementAmount = getIncrementAmount(employee);

  return {
    employeeNumber: employee.employeeNumber,
    payCode: employee.payCode || employee.employeeNumber,
    employeeName: getEmployeeName(employee),
    designation: employee.designation || '-',
    grade: employee.grade || '-',
    department: employee.department || '-',
    location: employee.location || '-',
    appointmentDate: employee.appointmentDate,
    promotionDate: employee.promotionDate,
    incrementDate: employee.incrementDate,
    currentSalary: employee.currentSalary,
    salaryPoint: employee.salaryPoint,
    incrementAmount,
    convertedSalary: employee.convertedSalary || employee.currentSalary + incrementAmount,
    payableSalary: getPayableSalary(employee) || employee.currentSalary + incrementAmount,
    gazetteReference: employee.salaryScale || 'Government salary gazette',
  };
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function openPrintableAssessmentForm(payload: AssessmentFormPayload) {
  const formWindow = window.open('', '_blank', 'width=900,height=1200');
  if (!formWindow) return;

  const previousPeriodStart = payload.appointmentDate || payload.incrementDate;
  const previousPeriodEnd = payload.incrementDate;
  const currentSalary = formatMoney(payload.currentSalary).replace('LKR', 'Rs.');
  const incrementAmount = formatMoney(payload.incrementAmount).replace('LKR', 'Rs.');
  const salaryPlusIncrement = formatMoney(payload.currentSalary + payload.incrementAmount).replace('LKR', 'Rs.');
  const convertedSalary = formatMoney(payload.convertedSalary).replace('LKR', 'Rs.');
  const payableSalary = formatMoney(payload.payableSalary).replace('LKR', 'Rs.');

  formWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Increment Assessment - ${escapeHtml(payload.payCode)}</title>
        <style>
          @page { size: A4; margin: 18mm 15mm; }
          * { box-sizing: border-box; }
          body { font-family: "Times New Roman", serif; margin: 0; color: #000; font-size: 16px; line-height: 1.35; }
          .top-note { margin-bottom: 6px; }
          h1 { margin: 0; text-align: center; font-size: 24px; }
          h2 { margin: 0 0 16px; text-align: center; font-size: 20px; font-weight: 400; }
          .period { text-align: center; font-size: 18px; margin-bottom: 18px; }
          .rule { border-top: 4px solid #000; margin: 0 0 44px; }
          .row { display: grid; grid-template-columns: 42px 210px 20px 1fr 90px 16px 120px; gap: 0; margin: 0 0 18px; align-items: baseline; }
          .row.simple { grid-template-columns: 42px 210px 20px 1fr; }
          .three { display: grid; grid-template-columns: 42px 1fr 1fr 1fr; gap: 22px; margin: 22px 0; }
          .three div span { display: block; margin-top: 10px; }
          .question { display: grid; grid-template-columns: 42px 1fr; margin: 18px 0; }
          .dots { margin-left: 84px; letter-spacing: 2px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { text-align: center; padding: 5px 7px; vertical-align: top; }
          th:first-child, td:first-child { text-align: left; width: 38%; }
          .leave-title { display: flex; justify-content: space-between; margin-top: 24px; }
          .note { margin-top: 20px; }
          .sign { margin-top: 120px; display: flex; justify-content: space-between; align-items: flex-end; }
          .sign strong { display: block; }
          footer { margin-top: 50px; border-top: 1px solid #777; padding-top: 36px; font-size: 13px; font-weight: 700; }
          @media print { button { display: none; } }
          button { position: fixed; right: 20px; top: 20px; padding: 10px 14px; border: 0; border-radius: 8px; background: #176b55; color: white; font: 700 13px sans-serif; }
        </style>
      </head>
      <body>
        <button onclick="window.print()">Print / Save PDF</button>
        <div class="top-note">Part I ( To be filled by the HR Department)</div>
        <h1>Board of Investment of Sri Lanka</h1>
        <h2>Performance Assessment (Junior Management)</h2>
        <div class="period">Period : From&nbsp; <strong>${escapeHtml(formatDate(previousPeriodStart))}</strong> to <strong>${escapeHtml(formatDate(previousPeriodEnd))}</strong></div>
        <div class="rule"></div>

        <div class="row simple"><span>1.</span><span>Name of employee</span><span>:</span><span>${escapeHtml(payload.employeeName)}</span></div>
        <div class="row simple"><span>2.</span><span>Pay Code No.</span><span>:</span><span>${escapeHtml(payload.payCode)}</span></div>
        <div class="row"><span>3.</span><span>Designation</span><span>:</span><span>${escapeHtml(payload.designation)}</span><span>Grade</span><span>:</span><span>${escapeHtml(payload.grade)}</span></div>
        <div class="row simple"><span>4.</span><span>Date of Increment</span><span>:</span><span>${escapeHtml(formatDate(payload.incrementDate))}</span></div>
        <div class="row simple"><span>5.</span><span>i) Date of appointment</span><span>:</span><span>${escapeHtml(formatDate(payload.appointmentDate))}</span></div>
        <div class="row simple"><span></span><span>ii) Date of promotion to the present grade</span><span>:</span><span>${escapeHtml(payload.promotionDate ? formatDate(payload.promotionDate) : '................................')}</span></div>
        <div class="row"><span>6.</span><span>Department</span><span>:</span><span>${escapeHtml(payload.department)}</span><span>Location</span><span>:</span><span>${escapeHtml(payload.location)}</span></div>
        <div class="row simple"><span>7.</span><span>Salary Scale</span><span>:</span><span>${escapeHtml(payload.gazetteReference)}</span></div>

        <div class="three">
          <span>8.</span>
          <div>Present Salary Point<span>${escapeHtml(payload.salaryPoint ? `Step ${payload.salaryPoint} / ${currentSalary}` : currentSalary)}</span></div>
          <div>Amount of Increment due<span>${escapeHtml(incrementAmount)}</span></div>
          <div>Present salary plus Increment<span>${escapeHtml(salaryPlusIncrement)}</span><span>Converted Salary:</span><span>${escapeHtml(convertedSalary)}</span><span>Payable Salary:</span><span>${escapeHtml(payableSalary)}</span></div>
        </div>

        <div class="question"><span>9.</span><span>Whether increment involves passing of Efficiency Bar. If so has the Officer qualified himself in all respect (Only for Clerical & Allied grades).</span></div>
        <div class="question"><span>10.</span><span>Whether increment for the previous year has been suspended, stopped or deferred.</span></div>
        <div class="dots">............................................................................................</div>
        <div class="row simple"><span>11.</span><span>Commendations/punishments during the increment period</span><span></span><span></span></div>

        <div class="leave-title"><span>12. &nbsp; Particulars of leave during the period :</span><span>From&nbsp; ${escapeHtml(formatDate(previousPeriodStart))} - ${escapeHtml(formatDate(previousPeriodEnd))}</span></div>
        <table>
          <thead><tr><th></th><th>Casual</th><th>Vacation</th><th>*Sick</th><th>*No-pay</th><th>Late<br/>Attendance</th></tr></thead>
          <tbody>
            <tr><td>Leave availed of in the previous year<br/>.................................</td><td>........</td><td>........</td><td>........</td><td>........</td><td>........</td></tr>
            <tr><td>Leave availed of in the current year<br/>.................................</td><td>........</td><td>........</td><td>........</td><td>........</td><td>........</td></tr>
          </tbody>
        </table>
        <p class="note">* Please indicate whether Medical Certificates have been submitted.</p>

        <div class="sign">
          <div><strong>Date :</strong> ........................</div>
          <div><strong>Officer concerned in HR Department</strong><strong>for Executive Director (HR & Admin.)</strong></div>
        </div>
        <footer>${escapeHtml(new Intl.DateTimeFormat('en-LK', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()))}</footer>
      </body>
    </html>
  `);
  formWindow.document.close();
  formWindow.focus();
}

export function IncrementPage() {
  const navigate = useNavigate();
  const { dataSource } = useDataSource();
  const sourceLabel = getEmployeeDataSourceLabel(dataSource);
  const [selectedMonth, setSelectedMonth] = useState(() => toMonthInput(new Date()));
  const [payCodeInput, setPayCodeInput] = useState('');
  const [activePayCode, setActivePayCode] = useState('');
  const [rows, setRows] = useState<Employee[]>([]);
  const [selectedEmployeeNumber, setSelectedEmployeeNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [movingToAssessment, setMovingToAssessment] = useState(false);
  const [usingExport, setUsingExport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [previewPayload, setPreviewPayload] = useState<AssessmentFormPayload | null>(null);
  const [previewPdf, setPreviewPdf] = useState<Blob | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [selectedEmployeeNumbers, setSelectedEmployeeNumbers] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'print' | 'move' | null>(null);
  const previewFrameRef = useRef<HTMLIFrameElement>(null);

  const range = useMemo(() => getMonthRange(selectedMonth), [selectedMonth]);

  useEffect(() => {
    if (!previewPdf) {
      setPreviewPdfUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(previewPdf);
    setPreviewPdfUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [previewPdf]);

  useEffect(() => {
    if (!previewPayload) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewPayload(null);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewPayload]);

  useEffect(() => {
    let ignore = false;

    setLoading(true);
    setError(null);
    setAssessmentError(null);
    setUsingExport(false);

    Promise.all([
      getDueIncrements({
        from: toDateInput(range.from),
        to: toDateInput(range.to),
        page: 1,
        pageSize: 100,
      }),
      getIncrementWorkflows(),
    ])
      .then(([employees, workflows]) => {
        if (ignore) return;
        const blockedEmployees = new Set(
          workflows
            .filter((workflow) => !['Draft', 'ReturnedToIncrement'].includes(workflow.status))
            .map((workflow) => `${workflow.employeeNumber}|${workflow.incrementDate}`),
        );
        const sortedRows = sortRows(employees.filter((employee) =>
          employee.incrementDate &&
          !blockedEmployees.has(`${employee.employeeNumber}|${employee.incrementDate}`)));
        setRows(sortedRows);
        setSelectedEmployeeNumbers(new Set());
        setSelectedEmployeeNumber(sortedRows[0]?.employeeNumber ?? null);
      })
      .catch(async () => {
        if (dataSource !== 'hcm') {
          if (!ignore) setError('Unable to load increment records from the HR staff database.');
          return;
        }
        try {
          const employees = await loadExportedEmployees();
          if (ignore) return;

          const exportedRows = sortRows(
            employees.filter((employee) =>
              employee.incrementDate &&
              employee.incrementDate >= toDateInput(range.from) &&
              employee.incrementDate <= toDateInput(range.to)),
          );
          setRows(exportedRows);
          setSelectedEmployeeNumbers(new Set());
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
  }, [dataSource, range.from, range.to]);

  const visibleRows = filterRows(rows, activePayCode);
  const selectedEmployee = visibleRows.find((employee) => employee.employeeNumber === selectedEmployeeNumber) ?? visibleRows[0] ?? null;
  const readyCount = visibleRows.filter((employee) => getDaysUntil(employee.incrementDate) <= 14).length;
  const incrementTotal = visibleRows.reduce((total, employee) => total + getIncrementAmount(employee), 0);
  const selectedEmployees = rows.filter((employee) =>
    selectedEmployeeNumbers.has(employee.employeeNumber));
  const selectableVisibleEmployees = visibleRows.filter(canGenerateAssessment);
  const allVisibleSelected = selectableVisibleEmployees.length > 0 &&
    selectableVisibleEmployees.every((employee) =>
      selectedEmployeeNumbers.has(employee.employeeNumber));

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setActivePayCode(payCodeInput.trim());
  };

  const handleRefresh = () => {
    setActivePayCode('');
    setPayCodeInput('');
    setSelectedMonth(toMonthInput(new Date()));
  };

  const toggleEmployeeSelection = (employeeNumber: string) => {
    setSelectedEmployeeNumbers((current) => {
      const next = new Set(current);
      if (next.has(employeeNumber)) next.delete(employeeNumber);
      else next.add(employeeNumber);
      return next;
    });
  };

  const toggleVisibleSelection = () => {
    setSelectedEmployeeNumbers((current) => {
      const next = new Set(current);
      selectableVisibleEmployees.forEach((employee) => {
        if (allVisibleSelected) next.delete(employee.employeeNumber);
        else next.add(employee.employeeNumber);
      });
      return next;
    });
  };

  const selectedPayloads = () => selectedEmployees.map(buildAssessmentPayload);

  const handlePrintSelected = async () => {
    let payloads: AssessmentFormPayload[];
    try {
      payloads = selectedPayloads();
      if (payloads.length === 0) throw new Error('Select at least one eligible employee.');
      setAssessmentError(null);
    } catch (selectionError) {
      setAssessmentError(selectionError instanceof Error ? selectionError.message : 'Unable to prepare selected assessments.');
      return;
    }

    const printWindow = window.open('', '_blank');
    setBulkAction('print');
    try {
      const pdf = await generateAssessmentForms(payloads);
      const pdfUrl = URL.createObjectURL(pdf);
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.focus();
          printWindow.print();
        }, { once: true });
        printWindow.location.href = pdfUrl;
        window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60_000);
      } else {
        downloadBlob(pdf, 'increment-assessments.pdf');
        URL.revokeObjectURL(pdfUrl);
      }
    } catch {
      printWindow?.close();
      setAssessmentError('The selected assessment PDFs could not be generated.');
    } finally {
      setBulkAction(null);
    }
  };

  const handleMoveSelected = async () => {
    let payloads: AssessmentFormPayload[];
    try {
      payloads = selectedPayloads();
      if (payloads.length === 0) throw new Error('Select at least one eligible employee.');
      setAssessmentError(null);
    } catch (selectionError) {
      setAssessmentError(selectionError instanceof Error ? selectionError.message : 'Unable to prepare selected employees.');
      return;
    }

    setBulkAction('move');
    const employeeByNumber = new Map(selectedEmployees.map((employee) => [employee.employeeNumber, employee]));
    const results = await Promise.allSettled(payloads.map((payload) => {
      const employee = employeeByNumber.get(payload.employeeNumber)!;
      return moveToAssessment({
        employeeNumber: payload.employeeNumber,
        payCode: payload.payCode,
        employeeName: payload.employeeName,
        designation: payload.designation,
        grade: payload.grade,
        department: payload.department,
        location: payload.location,
        incrementDate: payload.incrementDate,
        currentSalary: payload.currentSalary,
        salaryPoint: payload.salaryPoint!,
        incrementAmount: payload.incrementAmount,
        convertedSalary: payload.convertedSalary,
        payableSalary: payload.payableSalary,
        stagnationAllowance: employee.stagnationAllowance,
      });
    }));

    const movedNumbers = new Set(
      results.flatMap((result, index) =>
        result.status === 'fulfilled' ? [payloads[index].employeeNumber] : []),
    );
    setRows((current) => current.filter((employee) => !movedNumbers.has(employee.employeeNumber)));
    setSelectedEmployeeNumbers((current) =>
      new Set([...current].filter((employeeNumber) => !movedNumbers.has(employeeNumber))));
    setBulkAction(null);
    notifyWorkflowUpdated();

    const failedCount = results.length - movedNumbers.size;
    if (failedCount > 0) {
      setAssessmentError(
        `${movedNumbers.size} employees were moved. ${failedCount} could not be moved and remain selected.`,
      );
      return;
    }
    navigate('/assessments');
  };

  const handleGenerateAssessment = async () => {
    if (!selectedEmployee) return;

    let payload: AssessmentFormPayload;
    try {
      payload = buildAssessmentPayload(selectedEmployee);
      setAssessmentError(null);
    } catch (assessmentError) {
      setAssessmentError(assessmentError instanceof Error ? assessmentError.message : 'Unable to generate the assessment.');
      return;
    }

    setPreviewPayload(payload);
    setPreviewPdf(null);
    setGenerating(true);

    try {
      const pdf = await generateAssessmentForm(payload);
      setPreviewPdf(pdf);
    } catch {
      setAssessmentError('The PDF preview could not be generated. Confirm that the backend API is running.');
    } finally {
      setGenerating(false);
    }
  };

  const closeAssessmentPreview = () => {
    setPreviewPayload(null);
    setPreviewPdf(null);
  };

  const downloadAssessmentPdf = () => {
    if (!previewPayload || !previewPdf) return;
    downloadBlob(previewPdf, `increment-assessment-${previewPayload.payCode}.pdf`);
  };

  const printAssessment = () => {
    if (previewPdfUrl) {
      previewFrameRef.current?.contentWindow?.focus();
      previewFrameRef.current?.contentWindow?.print();
      return;
    }

    if (previewPayload) openPrintableAssessmentForm(previewPayload);
  };

  const handleMoveToAssessment = async () => {
    if (!previewPayload || !selectedEmployee || previewPayload.salaryPoint === null) return;

    setMovingToAssessment(true);
    setAssessmentError(null);
    try {
      await moveToAssessment({
        employeeNumber: previewPayload.employeeNumber,
        payCode: previewPayload.payCode,
        employeeName: previewPayload.employeeName,
        designation: previewPayload.designation,
        grade: previewPayload.grade,
        department: previewPayload.department,
        location: previewPayload.location,
        incrementDate: previewPayload.incrementDate,
        currentSalary: previewPayload.currentSalary,
        salaryPoint: previewPayload.salaryPoint,
        incrementAmount: previewPayload.incrementAmount,
        convertedSalary: previewPayload.convertedSalary,
        payableSalary: previewPayload.payableSalary,
        stagnationAllowance: selectedEmployee.stagnationAllowance,
      });
      setRows((current) => current.filter((employee) =>
        employee.employeeNumber !== previewPayload.employeeNumber));
      closeAssessmentPreview();
      notifyWorkflowUpdated();
      navigate('/assessments');
    } catch {
      setAssessmentError('The employee could not be moved to assessment. Refresh the salary details and try again.');
    } finally {
      setMovingToAssessment(false);
    }
  };

  return (
    <main className="dashboard module-page increments-page">
      <button className="back-button" onClick={() => navigate('/dashboard')}><ArrowLeft size={16} /> Overview</button>

      <section className="module-hero increment-hero">
        <div>
          <span className="eyebrow">Increment processing</span>
          <h1>Increment page</h1>
          <p>{usingExport ? 'Processing queue loaded from the exported HCM employee records.' : `Review upcoming increment records from the ${sourceLabel} database.`}</p>
        </div>
      </section>

      <section className="stat-grid increment-stat-grid">
        <article className="stat-card"><div className="stat-card__icon mint"><Users /></div><div className="stat-card__meta"><span>Employees queued</span><strong>{visibleRows.length}</strong><small>{range.label}</small></div></article>
        <article className="stat-card"><div className="stat-card__icon amber"><CalendarDays /></div><div className="stat-card__meta"><span>Ready in 14 days</span><strong>{readyCount}</strong><small>needs review</small></div></article>
        <article className="stat-card"><div className="stat-card__icon violet"><Calculator /></div><div className="stat-card__meta"><span>Gazette increments</span><strong>{formatMoney(incrementTotal)}</strong><small>assigned conversion tables</small></div></article>
        <article className="stat-card"><div className="stat-card__icon blue"><CheckCircle2 /></div><div className="stat-card__meta"><span>Status</span><strong>{usingExport ? 'Export' : 'Live'}</strong><small>{sourceLabel} source</small></div></article>
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
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                aria-label="Increment month"
              >
                {incrementMonths.map((month) => (
                  <option value={month.value} key={month.value}>{month.label}</option>
                ))}
              </select>
              <span>{incrementYear}</span>
            </label>
            <button className="filter-button" onClick={handleRefresh}>
              <RefreshCw size={15} /> Reset
            </button>
          </div>

          {selectedEmployees.length > 0 && (
            <div className="increment-bulk-bar">
              <strong>{selectedEmployees.length} selected</strong>
              <span>Generate one combined PDF or move all selected employees.</span>
              <div>
                <button className="filter-button" onClick={() => void handlePrintSelected()} disabled={bulkAction !== null}>
                  <Printer size={15} /> {bulkAction === 'print' ? 'Preparing...' : 'Print selected'}
                </button>
                <button className="primary-button" onClick={() => void handleMoveSelected()} disabled={bulkAction !== null}>
                  <ClipboardCheck size={15} /> {bulkAction === 'move' ? 'Moving...' : 'Move selected to assessment'}
                </button>
              </div>
            </div>
          )}

          {loading && <div className="employee-message">Loading increment records...</div>}
          {error && <div className="employee-message employee-message--error">{error}</div>}
          {assessmentError && <div className="employee-message employee-message--error">{assessmentError}</div>}
          {usingExport && !loading && <div className="employee-message">Showing exported HCM records because the backend API is not available.</div>}

          {!loading && !error && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th><label className="increment-select"><input type="checkbox" checked={allVisibleSelected} onChange={toggleVisibleSelection} disabled={selectableVisibleEmployees.length === 0} /> Employee</label></th><th>Pay code</th><th>Grade</th><th>Salary point</th><th>Current salary</th><th>Increment</th><th>Status</th><th /></tr>
                </thead>
                <tbody>
                  {visibleRows.map((employee, index) => {
                    const selected = selectedEmployee?.employeeNumber === employee.employeeNumber;
                    return (
                      <tr key={employee.employeeNumber} className={selected ? 'increment-row increment-row--selected' : 'increment-row'}>
                        <td><input className="increment-row-checkbox" type="checkbox" checked={selectedEmployeeNumbers.has(employee.employeeNumber)} onChange={() => toggleEmployeeSelection(employee.employeeNumber)} disabled={!canGenerateAssessment(employee)} aria-label={`Select ${getEmployeeName(employee)}`} /><span className={`table-avatar avatar-${index % 4}`}>{initials(employee)}</span><span><strong>{getEmployeeName(employee)}</strong><small>{employee.employeeNumber}</small></span></td>
                        <td>{employee.payCode || '-'}</td>
                        <td>{employee.grade || '-'}</td>
                        <td>{employee.salaryPoint ?? '-'}</td>
                        <td><strong>{formatMoney(employee.currentSalary)}</strong></td>
                        <td><strong>{formatMoney(getIncrementAmount(employee))}</strong></td>
                        <td><span className={employee.salaryConversionStatus === 'Applied' ? 'status status--ready' : 'status status--review'}>{getConversionLabel(employee)}</span></td>
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
              <p>Grade-based 2026 salary conversion</p>
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
                <div><dt>Salary point</dt><dd>{selectedEmployee.salaryPoint ?? '-'}</dd></div>
                <div><dt>Current salary</dt><dd>{formatMoney(selectedEmployee.currentSalary)}</dd></div>
                <div><dt>Increment amount</dt><dd>{formatMoney(getIncrementAmount(selectedEmployee))}</dd></div>
                <div><dt>Converted salary</dt><dd>{formatMoney(selectedEmployee.convertedSalary)}</dd></div>
                <div><dt>Payable salary</dt><dd>{formatMoney(getPayableSalary(selectedEmployee))}</dd></div>
                <div><dt>Conversion</dt><dd>{getConversionLabel(selectedEmployee)}</dd></div>
              </dl>

              <button className="primary-button" onClick={handleGenerateAssessment} disabled={generating || !canGenerateAssessment(selectedEmployee)}>
                {generating ? 'Generating...' : 'Generate assessment'} <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <div className="employee-message">Select an employee to preview increment details.</div>
          )}
        </aside>
      </section>

      {previewPayload && (
        <div className="assessment-preview-overlay" role="presentation" onMouseDown={closeAssessmentPreview}>
          <section
            className="assessment-preview-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assessment-preview-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="assessment-preview-header">
              <div>
                <span className="eyebrow">Assessment preview</span>
                <h2 id="assessment-preview-title">{previewPayload.employeeName}</h2>
                <p>Pay code {previewPayload.payCode} · {previewPayload.grade}</p>
              </div>
              <button className="assessment-preview-close" onClick={closeAssessmentPreview} aria-label="Close assessment preview">
                <X size={20} />
              </button>
            </header>

            <div className="assessment-preview-body">
              <aside className="assessment-preview-summary">
                <h3>Increment details</h3>
                <dl>
                  <div><dt>Increment date</dt><dd>{formatDate(previewPayload.incrementDate)}</dd></div>
                  <div><dt>Salary scale</dt><dd>{previewPayload.gazetteReference}</dd></div>
                  <div><dt>Salary point</dt><dd>{previewPayload.salaryPoint ?? '-'}</dd></div>
                  <div><dt>Current salary</dt><dd>{formatMoney(previewPayload.currentSalary)}</dd></div>
                  <div><dt>Increment</dt><dd>{formatMoney(previewPayload.incrementAmount)}</dd></div>
                  <div><dt>Converted salary</dt><dd>{formatMoney(previewPayload.convertedSalary)}</dd></div>
                  <div><dt>Payable salary</dt><dd>{formatMoney(previewPayload.payableSalary)}</dd></div>
                </dl>
              </aside>

              <div className="assessment-preview-document">
                {generating && (
                  <div className="assessment-preview-loading">
                    <RefreshCw size={24} />
                    <strong>Preparing PDF preview...</strong>
                    <span>The assessment is being generated from the approved salary conversion.</span>
                  </div>
                )}
                {!generating && previewPdfUrl && (
                  <iframe
                    ref={previewFrameRef}
                    src={previewPdfUrl}
                    title={`Increment assessment for ${previewPayload.employeeName}`}
                  />
                )}
                {!generating && !previewPdfUrl && (
                  <div className="assessment-preview-loading assessment-preview-loading--error">
                    <FileText size={24} />
                    <strong>PDF preview unavailable</strong>
                    <span>Check that the backend API is running, then close this preview and try again.</span>
                  </div>
                )}
              </div>
            </div>

            <footer className="assessment-preview-actions">
              <button className="filter-button" onClick={closeAssessmentPreview}>Close</button>
              <button className="filter-button" onClick={printAssessment} disabled={generating}>
                <Printer size={16} /> Print
              </button>
              <button className="primary-button" onClick={downloadAssessmentPdf} disabled={generating || !previewPdf}>
                <Download size={16} /> Download PDF
              </button>
              <button className="primary-button assessment-submit-button" onClick={() => void handleMoveToAssessment()} disabled={generating || movingToAssessment || !previewPdf}>
                <ClipboardCheck size={16} /> {movingToAssessment ? 'Moving...' : 'Move to assessment'}
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
