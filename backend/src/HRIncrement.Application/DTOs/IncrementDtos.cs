namespace HRIncrement.Application.DTOs;

public sealed record CalculateIncrementRequest(
    string EmployeeNumber,
    decimal CurrentSalary,
    int SalaryPoint,
    decimal IncrementAmount,
    decimal ConvertedSalary,
    decimal MaximumSalary,
    bool AllowStagnationAllowance);

public sealed record IncrementCalculationDto(
    string EmployeeNumber,
    decimal CurrentSalary,
    int SalaryPoint,
    decimal IncrementAmount,
    decimal ConvertedSalary,
    decimal PayableSalary,
    decimal StagnationAllowance,
    DateTimeOffset CalculatedAtUtc);
