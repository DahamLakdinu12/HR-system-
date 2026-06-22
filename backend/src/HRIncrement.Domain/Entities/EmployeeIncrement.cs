using HRIncrement.Domain.Common;
using HRIncrement.Domain.Enums;

namespace HRIncrement.Domain.Entities;

public sealed class EmployeeIncrement : AuditableEntity
{
    private EmployeeIncrement() { }

    public EmployeeIncrement(
        string employeeNumber,
        DateOnly dueDate,
        Guid salaryScaleId,
        IncrementCalculation calculation)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(employeeNumber);
        EmployeeNumber = employeeNumber.Trim();
        DueDate = dueDate;
        SalaryScaleId = salaryScaleId;
        Calculation = calculation;
    }

    public string EmployeeNumber { get; private set; } = string.Empty;
    public DateOnly DueDate { get; private set; }
    public Guid SalaryScaleId { get; private set; }
    public WorkflowStatus Status { get; private set; } = WorkflowStatus.Draft;
    public IncrementCalculation Calculation { get; private set; } = null!;
    public byte[] RowVersion { get; private set; } = [];

    public void SubmitForAssessment() => Status = WorkflowStatus.PendingAssessment;
}

public sealed record IncrementCalculation(
    decimal CurrentSalary,
    int SalaryPoint,
    decimal IncrementAmount,
    decimal ConvertedSalary,
    decimal PayableSalary,
    decimal StagnationAllowance,
    DateTimeOffset CalculatedAtUtc);
