using HRIncrement.Application.DTOs;

namespace HRIncrement.Application.Interfaces;

public interface IHcmEmployeeReader
{
    Task<EmployeeSearchResultDto> SearchAsync(
        string? search,
        string? payCode,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<EmployeeDto?> GetByEmployeeNumberAsync(string employeeNumber, CancellationToken cancellationToken);
    Task<IReadOnlyList<EmployeeDto>> GetDueIncrementsAsync(
        DateOnly from,
        DateOnly to,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
}
