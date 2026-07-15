USE [HRIncrement];
GO

IF OBJECT_ID(N'dbo.EmployeeHistoryEntries', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.EmployeeHistoryEntries
    (
        Id uniqueidentifier NOT NULL CONSTRAINT PK_EmployeeHistoryEntries PRIMARY KEY,
        EmployeeNumber nvarchar(50) NOT NULL,
        PayCode nvarchar(50) NOT NULL,
        EmployeeName nvarchar(300) NOT NULL,
        DataSource nvarchar(30) NOT NULL,
        EventType nvarchar(80) NOT NULL,
        Description nvarchar(1000) NOT NULL,
        Actor nvarchar(150) NOT NULL,
        OccurredAtUtc datetimeoffset NOT NULL,
        EffectiveDate date NULL,
        EmployeeIncrementId uniqueidentifier NULL,
        IncrementDueDate date NULL,
        FieldName nvarchar(150) NULL,
        PreviousValue nvarchar(1000) NULL,
        NewValue nvarchar(1000) NULL,
        PreviousSalaryPoint int NULL,
        NewSalaryPoint int NULL,
        PreviousSalary decimal(19,4) NULL,
        NewSalary decimal(19,4) NULL,
        IncrementAmount decimal(19,4) NULL,
        PreviousGrade nvarchar(100) NULL,
        NewGrade nvarchar(100) NULL
    );

    CREATE INDEX IX_EmployeeHistoryEntries_EmployeeIncrementId
        ON dbo.EmployeeHistoryEntries(EmployeeIncrementId);

    CREATE INDEX IX_EmployeeHistoryEntries_EmployeeNumber_OccurredAtUtc
        ON dbo.EmployeeHistoryEntries(EmployeeNumber, OccurredAtUtc);

    CREATE INDEX IX_EmployeeHistoryEntries_PayCode_OccurredAtUtc
        ON dbo.EmployeeHistoryEntries(PayCode, OccurredAtUtc);
END;
GO
