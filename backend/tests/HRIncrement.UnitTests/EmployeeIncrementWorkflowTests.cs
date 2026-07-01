using HRIncrement.Domain.Entities;
using HRIncrement.Domain.Enums;
using Xunit;

namespace HRIncrement.UnitTests;

public sealed class EmployeeIncrementWorkflowTests
{
    [Fact]
    public void Workflow_CanBeRejectedReturnedAndResubmitted()
    {
        var workflow = CreateWorkflow();

        workflow.MoveToAssessment();
        Assert.Equal(WorkflowStatus.PendingApproval, workflow.Status);

        workflow.Reject();
        Assert.Equal(WorkflowStatus.Rejected, workflow.Status);

        workflow.ReturnToIncrement();
        Assert.Equal(WorkflowStatus.ReturnedToIncrement, workflow.Status);

        workflow.MoveToAssessment();
        Assert.Equal(WorkflowStatus.PendingApproval, workflow.Status);
    }

    [Fact]
    public void Workflow_CanOnlyApproveWhileWaitingForApproval()
    {
        var workflow = CreateWorkflow();

        Assert.Throws<InvalidOperationException>(() => workflow.Approve());

        workflow.MoveToAssessment();
        workflow.Approve();

        Assert.Equal(WorkflowStatus.Approved, workflow.Status);
        Assert.Throws<InvalidOperationException>(() => workflow.Reject());
    }

    [Fact]
    public void Workflow_CanUndoMoveToAssessmentBeforeDecision()
    {
        var workflow = CreateWorkflow();

        workflow.MoveToAssessment();
        workflow.ReturnToIncrement();

        Assert.Equal(WorkflowStatus.ReturnedToIncrement, workflow.Status);
    }

    private static EmployeeIncrement CreateWorkflow() => new(
        "1055",
        "1055",
        "R M S GAMINI",
        "Security Officer",
        "JM-1-1-I",
        "SECURITY & FIRE",
        "BEPZ",
        "hr-staff",
        new DateOnly(2026, 7, 15),
        Guid.Empty,
        new IncrementCalculation(
            56_960,
            17,
            1_135,
            100_530,
            89_178,
            0,
            new DateTimeOffset(2026, 7, 1, 0, 0, 0, TimeSpan.Zero)));
}
