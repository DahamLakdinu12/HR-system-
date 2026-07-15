USE [HRIncrement];
GO

IF OBJECT_ID(N'dbo.EmployeeHistoryEntries', N'U') IS NULL
BEGIN
    RAISERROR('EmployeeHistoryEntries table does not exist. Run create_employee_history_entries.sql first.', 16, 1);
    RETURN;
END;
GO

INSERT INTO dbo.EmployeeHistoryEntries
(
    Id,
    EmployeeNumber,
    PayCode,
    EmployeeName,
    DataSource,
    EventType,
    Description,
    Actor,
    OccurredAtUtc,
    EffectiveDate,
    EmployeeIncrementId,
    IncrementDueDate,
    PreviousSalaryPoint,
    NewSalaryPoint,
    PreviousSalary,
    NewSalary,
    IncrementAmount,
    PreviousGrade,
    NewGrade
)
SELECT
    NEWID(),
    workflow.EmployeeNumber,
    workflow.PayCode,
    workflow.EmployeeName,
    workflow.DataSource,
    'MovedToAssessment',
    'Increment record was moved to assessment and is waiting for approval.',
    COALESCE(NULLIF(workflow.ModifiedBy, ''), NULLIF(workflow.CreatedBy, ''), 'system'),
    COALESCE(workflow.ModifiedAtUtc, workflow.CreatedAtUtc),
    workflow.DueDate,
    workflow.Id,
    workflow.DueDate,
    workflow.SalaryPoint,
    workflow.SalaryPoint + 1,
    workflow.CurrentSalary,
    workflow.ConvertedSalary,
    workflow.IncrementAmount,
    workflow.Grade,
    workflow.Grade
FROM dbo.EmployeeIncrements workflow
WHERE NOT EXISTS
(
    SELECT 1
    FROM dbo.EmployeeHistoryEntries history
    WHERE history.EmployeeIncrementId = workflow.Id
      AND history.EventType = 'MovedToAssessment'
);
GO

INSERT INTO dbo.EmployeeHistoryEntries
(
    Id,
    EmployeeNumber,
    PayCode,
    EmployeeName,
    DataSource,
    EventType,
    Description,
    Actor,
    OccurredAtUtc,
    EffectiveDate,
    EmployeeIncrementId,
    IncrementDueDate,
    PreviousSalaryPoint,
    NewSalaryPoint,
    PreviousSalary,
    NewSalary,
    IncrementAmount,
    PreviousGrade,
    NewGrade
)
SELECT
    NEWID(),
    workflow.EmployeeNumber,
    workflow.PayCode,
    workflow.EmployeeName,
    workflow.DataSource,
    CASE WHEN decision.Approved = 1 THEN 'ApprovedIncrement' ELSE 'RejectedAssessment' END,
    CASE
        WHEN decision.Approved = 1
            THEN 'Increment was approved and the employee salary step was advanced.'
        ELSE 'Increment assessment was declined and kept in the assessment stage.'
    END,
    decision.DecidedBy,
    decision.DecidedAtUtc,
    workflow.DueDate,
    workflow.Id,
    workflow.DueDate,
    workflow.SalaryPoint,
    CASE WHEN decision.Approved = 1 THEN workflow.SalaryPoint + 1 ELSE workflow.SalaryPoint END,
    workflow.CurrentSalary,
    CASE WHEN decision.Approved = 1 THEN workflow.ConvertedSalary ELSE workflow.CurrentSalary END,
    workflow.IncrementAmount,
    workflow.Grade,
    workflow.Grade
FROM dbo.WorkflowDecisions decision
JOIN dbo.EmployeeIncrements workflow
    ON workflow.Id = decision.EmployeeIncrementId
WHERE NOT EXISTS
(
    SELECT 1
    FROM dbo.EmployeeHistoryEntries history
    WHERE history.EmployeeIncrementId = workflow.Id
      AND history.EventType = CASE WHEN decision.Approved = 1 THEN 'ApprovedIncrement' ELSE 'RejectedAssessment' END
      AND history.OccurredAtUtc = decision.DecidedAtUtc
);
GO
