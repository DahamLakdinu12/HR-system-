namespace HRIncrement.Application.DTOs;

public sealed record AssessmentFormDto(
    string EmployeeNumber,
    string EmployeeName,
    string Designation,
    string Grade,
    string Department,
    DateOnly IncrementDate,
    decimal CurrentSalary,
    decimal IncrementAmount,
    decimal PayableSalary,
    string GazetteReference);
