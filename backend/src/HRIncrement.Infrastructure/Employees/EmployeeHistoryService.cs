using HRIncrement.Application.DTOs;
using HRIncrement.Application.Interfaces;
using HRIncrement.Domain.Entities;
using HRIncrement.Infrastructure.HcmIntegration;
using Microsoft.EntityFrameworkCore;

namespace HRIncrement.Infrastructure.Employees;

internal sealed class EmployeeHistoryService(HrStaffDbContext hrStaffDbContext)
    : IEmployeeHistoryService
{
    public async Task<IReadOnlyList<EmployeeHistoryEntryDto>> GetByPayCodeAsync(
        string payCode,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(payCode);
        var normalizedPayCode = payCode.Trim();

        return await hrStaffDbContext.EmployeeHistoryEntries
            .AsNoTracking()
            .Where(x => x.PayCode == normalizedPayCode || x.EmployeeNumber == normalizedPayCode)
            .OrderByDescending(x => x.OccurredAtUtc)
            .ThenByDescending(x => x.EffectiveDate)
            .Select(x => new EmployeeHistoryEntryDto(
                x.Id,
                x.EmployeeNumber,
                x.PayCode,
                x.EmployeeName,
                x.EventType,
                x.Description,
                x.Actor,
                x.OccurredAtUtc,
                x.EffectiveDate,
                x.IncrementDueDate,
                x.FieldName,
                x.PreviousValue,
                x.NewValue,
                x.PreviousSalaryPoint,
                x.NewSalaryPoint,
                x.PreviousSalary,
                x.NewSalary,
                x.IncrementAmount,
                x.PreviousGrade,
                x.NewGrade))
            .ToListAsync(cancellationToken);
    }

    public void Track(EmployeeHistoryEntry entry) =>
        hrStaffDbContext.EmployeeHistoryEntries.Add(entry);

    public Task SaveChangesAsync(CancellationToken cancellationToken) =>
        hrStaffDbContext.SaveChangesAsync(cancellationToken);
}
