using HRIncrement.Domain.Common;
using HRIncrement.Domain.Enums;

namespace HRIncrement.Domain.Entities;

public sealed class EmployeeIncrement : AuditableEntity
{
    private EmployeeIncrement() { }

    public EmployeeIncrement(
        string employeeNumber,
        string payCode,
        string employeeName,
        string designation,
        string grade,
        string department,
        string location,
        string dataSource,
        DateOnly dueDate,
        Guid salaryScaleId,
        IncrementCalculation calculation)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(employeeNumber);
        ArgumentException.ThrowIfNullOrWhiteSpace(payCode);
        ArgumentException.ThrowIfNullOrWhiteSpace(employeeName);
        ArgumentException.ThrowIfNullOrWhiteSpace(dataSource);
        EmployeeNumber = employeeNumber.Trim();
        PayCode = payCode.Trim();
        EmployeeName = employeeName.Trim();
        Designation = designation.Trim();
        Grade = grade.Trim();
        Department = department.Trim();
        Location = location.Trim();
        DataSource = dataSource.Trim();
        DueDate = dueDate;
        SalaryScaleId = salaryScaleId;
        Calculation = calculation;
    }

    public string EmployeeNumber { get; private set; } = string.Empty;
    public string PayCode { get; private set; } = string.Empty;
    public string EmployeeName { get; private set; } = string.Empty;
    public string Designation { get; private set; } = string.Empty;
    public string Grade { get; private set; } = string.Empty;
    public string Department { get; private set; } = string.Empty;
    public string Location { get; private set; } = string.Empty;
    public string DataSource { get; private set; } = string.Empty;
    public DateOnly DueDate { get; private set; }
    public Guid SalaryScaleId { get; private set; }
    public WorkflowStatus Status { get; private set; } = WorkflowStatus.Draft;
    public IncrementCalculation Calculation { get; private set; } = null!;
    public byte[] RowVersion { get; private set; } = [];

    public void MoveToAssessment()
    {
        if (Status is not (WorkflowStatus.Draft or WorkflowStatus.ReturnedToIncrement))
            throw new InvalidOperationException("Only increment-stage records can move to assessment.");
        Status = WorkflowStatus.PendingApproval;
    }

    public void Approve()
    {
        if (Status != WorkflowStatus.PendingApproval)
            throw new InvalidOperationException("Only records waiting for approval can be approved.");
        Status = WorkflowStatus.Approved;
    }

    public void Reject()
    {
        if (Status != WorkflowStatus.PendingApproval)
            throw new InvalidOperationException("Only records waiting for approval can be rejected.");
        Status = WorkflowStatus.Rejected;
    }

    public void ReturnToIncrement()
    {
        if (Status is not (WorkflowStatus.PendingApproval or WorkflowStatus.Rejected))
            throw new InvalidOperationException(
                "Only pending or rejected assessment records can return to increments.");
        Status = WorkflowStatus.ReturnedToIncrement;
    }
}

public sealed record IncrementCalculation(
    decimal CurrentSalary,
    int SalaryPoint,
    decimal IncrementAmount,
    decimal ConvertedSalary,
    decimal PayableSalary,
    decimal StagnationAllowance,
    DateTimeOffset CalculatedAtUtc,
    bool IsStagnationIncrement = false);
