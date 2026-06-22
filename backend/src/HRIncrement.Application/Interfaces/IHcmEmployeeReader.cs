using HRIncrement.Application.DTOs;

namespace HRIncrement.Application.Interfaces;

public interface IHcmEmployeeReader
{
    Task<EmployeeDto?> GetByEmployeeNumberAsync(string employeeNumber, CancellationToken cancellationToken);
    Task<IReadOnlyList<EmployeeDto>> GetDueIncrementsAsync(
        DateOnly from,
        DateOnly to,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
}
