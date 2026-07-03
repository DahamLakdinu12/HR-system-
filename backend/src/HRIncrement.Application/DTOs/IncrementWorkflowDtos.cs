namespace HRIncrement.Application.DTOs;

public sealed record MoveToAssessmentRequest(
    string EmployeeNumber,
    string PayCode,
    string EmployeeName,
    string Designation,
    string Grade,
    string Department,
    string Location,
    DateOnly IncrementDate,
    decimal CurrentSalary,
    int SalaryPoint,
    decimal IncrementAmount,
    decimal ConvertedSalary,
    decimal PayableSalary,
    decimal StagnationAllowance,
    bool IsStagnationIncrement);

public sealed record IncrementWorkflowDto(
    Guid Id,
    string EmployeeNumber,
    string PayCode,
    string EmployeeName,
    string Designation,
    string Grade,
    string Department,
    string Location,
    string DataSource,
    DateOnly IncrementDate,
    decimal CurrentSalary,
    int SalaryPoint,
    decimal IncrementAmount,
    decimal ConvertedSalary,
    decimal PayableSalary,
    decimal StagnationAllowance,
    bool IsStagnationIncrement,
    string Status,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? ModifiedAtUtc);

public sealed record WorkflowCountsDto(
    int Increments,
    int Assessments,
    int Approvals);
