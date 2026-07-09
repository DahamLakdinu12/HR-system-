using HRIncrement.Application.DTOs;

namespace HRIncrement.Application.Interfaces;

public interface IEmployeeReader
{
    Task<EmployeeSearchResultDto> SearchAsync(
        EmployeeDataSource dataSource,
        string? search,
        string? payCode,
        string? department,
        string? sortBy,
        string? sortDirection,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<EmployeeDto?> GetByEmployeeNumberAsync(
        EmployeeDataSource dataSource,
        string employeeNumber,
        CancellationToken cancellationToken);

    Task<EmployeeDto> UpdateHrStaffEmployeeAsync(
        string employeeNumber,
        UpdateHrStaffEmployeeRequest request,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<DepartmentSummaryDto>> GetDepartmentsAsync(
        EmployeeDataSource dataSource,
        CancellationToken cancellationToken);

    Task<EmployeeLookupOptionsDto> GetLookupOptionsAsync(
        EmployeeDataSource dataSource,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<EmployeeDto>> GetDueIncrementsAsync(
        EmployeeDataSource dataSource,
        DateOnly from,
        DateOnly to,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
}
