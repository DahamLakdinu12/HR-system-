using HRIncrement.Application.DTOs;
using HRIncrement.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HRIncrement.Infrastructure.HcmIntegration;

internal sealed class HcmEmployeeReader(HcmDbContext dbContext) : IHcmEmployeeReader
{
    public async Task<EmployeeSearchResultDto> SearchAsync(
        string? search,
        string? payCode,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = Project();
        if (!string.IsNullOrWhiteSpace(payCode))
        {
            var payCodeTerm = payCode.Trim();
            query = query.Where(x => x.PayCode.Contains(payCodeTerm));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(x =>
                x.EmployeeNumber.Contains(term) ||
                x.PayCode.Contains(term) ||
                x.FullName.Contains(term) ||
                x.Designation.Contains(term) ||
                x.Grade.Contains(term) ||
                x.Department.Contains(term) ||
                x.Location.Contains(term));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(x => x.EmployeeNumber)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new EmployeeSearchResultDto(items, page, pageSize, totalCount);
    }

    public Task<EmployeeDto?> GetByEmployeeNumberAsync(string employeeNumber, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(employeeNumber);
        return Project().SingleOrDefaultAsync(x => x.EmployeeNumber == employeeNumber, cancellationToken);
    }

    public async Task<IReadOnlyList<EmployeeDto>> GetDueIncrementsAsync(
        DateOnly from,
        DateOnly to,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        if (to < from) throw new ArgumentException("The end date must not precede the start date.");
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        return await Project()
            .Where(x => x.IncrementDate >= from && x.IncrementDate <= to)
            .OrderBy(x => x.IncrementDate)
            .ThenBy(x => x.EmployeeNumber)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    private IQueryable<EmployeeDto> Project() => dbContext.Employees
        .AsNoTracking()
        .Select(x => new EmployeeDto(
            x.EmployeeNumber,
            x.PayCode,
            x.FullName,
            x.Designation,
            x.Grade,
            x.Department,
            x.Location,
            x.AppointmentDate,
            x.PromotionDate,
            x.IncrementDate,
            x.CurrentSalary));
}
