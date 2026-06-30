using HRIncrement.Application.DTOs;
using HRIncrement.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HRIncrement.Infrastructure.HcmIntegration;

internal sealed class HcmEmployeeReader(HcmDbContext dbContext) : IHcmEmployeeReader
{
    public async Task<EmployeeSearchResultDto> SearchAsync(
        string? search,
        string? payCode,
        string? sortBy,
        string? sortDirection,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = Rows();
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
        query = ApplySorting(query, sortBy, sortDirection);

        var items = await Project(query
            .Skip((page - 1) * pageSize)
            .Take(pageSize))
            .ToListAsync(cancellationToken);

        return new EmployeeSearchResultDto(items, page, pageSize, totalCount);
    }

    public Task<EmployeeDto?> GetByEmployeeNumberAsync(string employeeNumber, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(employeeNumber);
        return Project(Rows().Where(x => x.EmployeeNumber == employeeNumber))
            .SingleOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<DepartmentSummaryDto>> GetDepartmentsAsync(
        CancellationToken cancellationToken)
    {
        var departments = await Rows()
            .GroupBy(x => x.Department == string.Empty ? "Unassigned" : x.Department)
            .Select(group => new DepartmentSummaryDto(group.Key, group.Count()))
            .ToListAsync(cancellationToken);

        return departments
            .OrderBy(x => x.Name == "Unassigned")
            .ThenBy(x => x.Name, StringComparer.OrdinalIgnoreCase)
            .ToList();
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

        return await Project(Rows()
            .Where(x => x.IncrementDate >= from && x.IncrementDate <= to)
            .OrderBy(x => x.IncrementDate)
            .ThenBy(x => x.EmployeeNumber)
            .Skip((page - 1) * pageSize)
            .Take(pageSize))
            .ToListAsync(cancellationToken);
    }

    private IQueryable<HcmEmployeeRow> Rows() => dbContext.Employees.AsNoTracking();

    private static IQueryable<EmployeeDto> Project(IQueryable<HcmEmployeeRow> query) => query
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

    private static IQueryable<HcmEmployeeRow> ApplySorting(
        IQueryable<HcmEmployeeRow> query,
        string? sortBy,
        string? sortDirection)
    {
        var descending = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);
        var normalizedSortBy = sortBy?.Trim().ToLowerInvariant();

        return normalizedSortBy switch
        {
            "paycode" => descending
                ? query.OrderByDescending(x => x.PayCode).ThenBy(x => x.EmployeeNumber)
                : query.OrderBy(x => x.PayCode).ThenBy(x => x.EmployeeNumber),
            "designation" => descending
                ? query.OrderByDescending(x => x.Designation).ThenBy(x => x.EmployeeNumber)
                : query.OrderBy(x => x.Designation).ThenBy(x => x.EmployeeNumber),
            "grade" => descending
                ? query.OrderByDescending(x => x.Grade).ThenBy(x => x.EmployeeNumber)
                : query.OrderBy(x => x.Grade).ThenBy(x => x.EmployeeNumber),
            "location" => descending
                ? query.OrderByDescending(x => x.Location).ThenBy(x => x.EmployeeNumber)
                : query.OrderBy(x => x.Location).ThenBy(x => x.EmployeeNumber),
            "incrementdate" => descending
                ? query.OrderByDescending(x => x.IncrementDate).ThenBy(x => x.EmployeeNumber)
                : query.OrderBy(x => x.IncrementDate).ThenBy(x => x.EmployeeNumber),
            "currentsalary" => descending
                ? query.OrderByDescending(x => x.CurrentSalary).ThenBy(x => x.EmployeeNumber)
                : query.OrderBy(x => x.CurrentSalary).ThenBy(x => x.EmployeeNumber),
            _ => descending
                ? query.OrderByDescending(x => x.FullName).ThenBy(x => x.EmployeeNumber)
                : query.OrderBy(x => x.FullName).ThenBy(x => x.EmployeeNumber),
        };
    }
}
