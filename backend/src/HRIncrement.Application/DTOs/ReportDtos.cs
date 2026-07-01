namespace HRIncrement.Application.DTOs;

public sealed record MonthlyReportSummaryDto(
    int Year,
    int Month,
    string MonthLabel,
    int IncrementEmployees,
    decimal TotalIncrementAmount,
    decimal TotalPayableSalary,
    int ApprovedEmployees,
    int DeclinedEmployees,
    decimal ApprovalRate);

public sealed record IncrementRegisterRowDto(
    string EmployeeNumber,
    string PayCode,
    string EmployeeName,
    string Designation,
    string Grade,
    string Department,
    string Location,
    DateOnly IncrementDate,
    decimal CurrentSalary,
    int? SalaryPoint,
    decimal IncrementAmount,
    decimal ConvertedSalary,
    decimal PayableSalary,
    string ConversionStatus);

public sealed record ApprovalDecisionRowDto(
    string PayCode,
    string EmployeeName,
    string Designation,
    string Grade,
    string Department,
    DateOnly IncrementDate,
    decimal CurrentSalary,
    decimal IncrementAmount,
    decimal PayableSalary,
    bool Approved,
    string DecidedBy,
    DateTimeOffset DecidedAtUtc);

public sealed record ReportDocumentDto(
    byte[] Content,
    string FileName);
