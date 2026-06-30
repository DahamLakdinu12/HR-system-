using HRIncrement.Application.DTOs;

namespace HRIncrement.Application.Interfaces;

public interface IHcmEmployeeReader
{
    Task<EmployeeSearchResultDto> SearchAsync(
        string? search,
        string? payCode,
        string? department,
        string? sortBy,
        string? sortDirection,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<EmployeeDto?> GetByEmployeeNumberAsync(string employeeNumber, CancellationToken cancellationToken);
    Task<IReadOnlyList<DepartmentSummaryDto>> GetDepartmentsAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<EmployeeDto>> GetDueIncrementsAsync(
        DateOnly from,
        DateOnly to,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
}
