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

public sealed record EmployeeLookupOptionsDto(
    IReadOnlyList<string> Departments,
    IReadOnlyList<string> Locations,
    IReadOnlyList<string> SalaryScales,
    IReadOnlyList<string> Grades,
    IReadOnlyList<string> Designations);

public sealed record UpdateHrStaffEmployeeRequest(
    string FullName,
    string Designation,
    string Grade,
    string Department,
    string Location,
    string SalaryScale,
    DateOnly AppointmentDate,
    DateOnly? PromotionDate,
    DateOnly? NextIncrementDate,
    decimal CurrentSalary,
    decimal BasicSalary2027,
    decimal IncrementAmount,
    decimal StagnationAllowance,
    int? SalaryPoint);

public enum EmployeeDataSource
{
    HrStaff
}
