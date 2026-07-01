using HRIncrement.Domain.Common;

namespace HRIncrement.Domain.Entities;

public sealed class WorkflowDecision : Entity
{
    private WorkflowDecision() { }

    public WorkflowDecision(
        Guid employeeIncrementId,
        bool approved,
        string decidedBy,
        DateTimeOffset decidedAtUtc)
    {
        if (employeeIncrementId == Guid.Empty)
            throw new ArgumentException("A workflow identifier is required.", nameof(employeeIncrementId));
        ArgumentException.ThrowIfNullOrWhiteSpace(decidedBy);

        EmployeeIncrementId = employeeIncrementId;
        Approved = approved;
        DecidedBy = decidedBy.Trim();
        DecidedAtUtc = decidedAtUtc;
    }

    public Guid EmployeeIncrementId { get; private set; }
    public bool Approved { get; private set; }
    public string DecidedBy { get; private set; } = string.Empty;
    public DateTimeOffset DecidedAtUtc { get; private set; }
}
