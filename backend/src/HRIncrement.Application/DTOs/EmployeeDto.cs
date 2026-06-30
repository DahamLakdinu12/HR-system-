namespace HRIncrement.Application.DTOs;

public sealed record EmployeeDto(
    string EmployeeNumber,
    string PayCode,
    string FullName,
    string Designation,
    string Grade,
    string Department,
    string Location,
    DateOnly AppointmentDate,
    DateOnly? PromotionDate,
    DateOnly? IncrementDate,
    decimal CurrentSalary,
    decimal IncrementAmount,
    decimal StagnationAllowance,
    string SalaryScale);

public sealed record EmployeeSearchResultDto(
    IReadOnlyList<EmployeeDto> Items,
    int Page,
    int PageSize,
    int TotalCount);

public sealed record DepartmentSummaryDto(
    string Name,
    int EmployeeCount);

public enum EmployeeDataSource
{
    Hcm,
    HrStaff
}
