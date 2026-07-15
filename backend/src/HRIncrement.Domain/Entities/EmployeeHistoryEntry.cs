using HRIncrement.Domain.Common;

namespace HRIncrement.Domain.Entities;

public sealed class EmployeeHistoryEntry : Entity
{
    private EmployeeHistoryEntry() { }

    public EmployeeHistoryEntry(
        string employeeNumber,
        string payCode,
        string employeeName,
        string dataSource,
        string eventType,
        string description,
        string actor,
        DateTimeOffset occurredAtUtc)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(employeeNumber);
        ArgumentException.ThrowIfNullOrWhiteSpace(payCode);
        ArgumentException.ThrowIfNullOrWhiteSpace(eventType);
        ArgumentException.ThrowIfNullOrWhiteSpace(description);
        ArgumentException.ThrowIfNullOrWhiteSpace(actor);

        EmployeeNumber = employeeNumber.Trim();
        PayCode = payCode.Trim();
        EmployeeName = employeeName.Trim();
        DataSource = dataSource.Trim();
        EventType = eventType.Trim();
        Description = description.Trim();
        Actor = actor.Trim();
        OccurredAtUtc = occurredAtUtc;
    }

    public string EmployeeNumber { get; private set; } = string.Empty;
    public string PayCode { get; private set; } = string.Empty;
    public string EmployeeName { get; private set; } = string.Empty;
    public string DataSource { get; private set; } = string.Empty;
    public string EventType { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public string Actor { get; private set; } = string.Empty;
    public DateTimeOffset OccurredAtUtc { get; private set; }
    public DateOnly? EffectiveDate { get; private set; }
    public Guid? EmployeeIncrementId { get; private set; }
    public DateOnly? IncrementDueDate { get; private set; }
    public string? FieldName { get; private set; }
    public string? PreviousValue { get; private set; }
    public string? NewValue { get; private set; }
    public int? PreviousSalaryPoint { get; private set; }
    public int? NewSalaryPoint { get; private set; }
    public decimal? PreviousSalary { get; private set; }
    public decimal? NewSalary { get; private set; }
    public decimal? IncrementAmount { get; private set; }
    public string? PreviousGrade { get; private set; }
    public string? NewGrade { get; private set; }

    public EmployeeHistoryEntry WithFieldChange(
        string fieldName,
        string? previousValue,
        string? newValue)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(fieldName);
        FieldName = fieldName.Trim();
        PreviousValue = Normalize(previousValue);
        NewValue = Normalize(newValue);
        return this;
    }

    public EmployeeHistoryEntry WithIncrement(
        Guid employeeIncrementId,
        DateOnly incrementDueDate,
        int? previousSalaryPoint,
        int? newSalaryPoint,
        decimal? previousSalary,
        decimal? newSalary,
        decimal? incrementAmount)
    {
        EmployeeIncrementId = employeeIncrementId;
        IncrementDueDate = incrementDueDate;
        EffectiveDate = incrementDueDate;
        PreviousSalaryPoint = previousSalaryPoint;
        NewSalaryPoint = newSalaryPoint;
        PreviousSalary = previousSalary;
        NewSalary = newSalary;
        IncrementAmount = incrementAmount;
        return this;
    }

    public EmployeeHistoryEntry WithPromotionChange(
        string? previousGrade,
        string? newGrade,
        DateOnly? effectiveDate)
    {
        PreviousGrade = Normalize(previousGrade);
        NewGrade = Normalize(newGrade);
        EffectiveDate = effectiveDate;
        return this;
    }

    private static string? Normalize(string? value)
    {
        var trimmed = value?.Trim();
        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
    }
}
