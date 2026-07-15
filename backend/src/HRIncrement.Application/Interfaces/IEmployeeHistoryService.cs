using HRIncrement.Application.DTOs;
using HRIncrement.Domain.Entities;

namespace HRIncrement.Application.Interfaces;

public interface IEmployeeHistoryService
{
    Task<IReadOnlyList<EmployeeHistoryEntryDto>> GetByPayCodeAsync(
        string payCode,
        CancellationToken cancellationToken);

    void Track(EmployeeHistoryEntry entry);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
