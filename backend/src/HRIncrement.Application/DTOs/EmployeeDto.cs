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
    decimal PresentBasicSalary,
    decimal PresentPayableSalary,
    int? SalaryPoint,
    decimal IncrementAmount,
    decimal ConvertedSalary,
    decimal PayableSalary,
    decimal StagnationAllowance,
    string SalaryScale,
    string SalaryConversionStatus);

public sealed record EmployeeSearchResultDto(
    IReadOnlyList<EmployeeDto> Items,
    int Page,
    int PageSize,
    int TotalCount);

public sealed record DepartmentSummaryDto(
    string Name,
    int EmployeeCount);

public sealed record UpdateHrStaffEmployeeRequest(
    string Designation,
    string Grade,
    string Department,
    string Location,
    DateOnly AppointmentDate,
    DateOnly? PromotionDate,
    DateOnly? NextIncrementDate);

public enum EmployeeDataSource
{
    Hcm,
    HrStaff
}
