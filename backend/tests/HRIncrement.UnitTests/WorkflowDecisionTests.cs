using HRIncrement.Domain.Entities;
using Xunit;

namespace HRIncrement.UnitTests;

public sealed class WorkflowDecisionTests
{
    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void Decision_PreservesMonthlyReportFacts(bool approved)
    {
        var workflowId = Guid.NewGuid();
        var decidedAt = new DateTimeOffset(2026, 7, 31, 20, 0, 0, TimeSpan.Zero);

        var decision = new WorkflowDecision(
            workflowId,
            approved,
            "HR Approver",
            decidedAt);

        Assert.Equal(workflowId, decision.EmployeeIncrementId);
        Assert.Equal(approved, decision.Approved);
        Assert.Equal("HR Approver", decision.DecidedBy);
        Assert.Equal(decidedAt, decision.DecidedAtUtc);
    }
}
