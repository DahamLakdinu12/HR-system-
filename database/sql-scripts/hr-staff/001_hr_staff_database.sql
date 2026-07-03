IF DB_ID(N'HRStaff') IS NULL
BEGIN
    CREATE DATABASE HRStaff;
END;
GO

USE HRStaff;
GO

DROP VIEW IF EXISTS dbo.vw_HRIncrementEmployees;
DROP TABLE IF EXISTS dbo.Employees;
DROP TABLE IF EXISTS dbo.SalaryConversionPoints;
GO

CREATE TABLE dbo.Employees
(
    PayCode nvarchar(30) NOT NULL CONSTRAINT PK_HRStaff_Employees PRIMARY KEY,
    Sex nvarchar(10) NOT NULL,
    FirstName nvarchar(200) NOT NULL,
    LastName nvarchar(200) NOT NULL,
    DateOfBirth date NOT NULL,
    DateJoined date NOT NULL,
    DateOfPromotion date NULL,
    IncrementLevel int NOT NULL,
    SalaryPoint decimal(19,4) NOT NULL,
    StagnationAllowance decimal(19,4) NULL,
    StagnationAllowanceNote nvarchar(200) NULL,
    DateRetired date NULL,
    NextIncrementDate date NULL,
    PayableSalary2026 decimal(19,4) NOT NULL,
    PostDescription nvarchar(300) NOT NULL,
    EPFNumber nvarchar(100) NULL,
    SalaryScale nvarchar(300) NULL,
    StartPoint decimal(19,4) NOT NULL,
    IncrementAmount decimal(19,4) NOT NULL,
    SequenceNumber int NOT NULL,
    NumberOfIncrements int NULL,
    ExistingGradeCode nvarchar(50) NOT NULL,
    NewGrade nvarchar(100) NOT NULL,
    WorkLocation nvarchar(100) NOT NULL,
    Department nvarchar(300) NOT NULL
);
GO

CREATE TABLE dbo.SalaryConversionPoints
(
    GradeCode nvarchar(100) NOT NULL,
    GazetteCode nvarchar(200) NOT NULL,
    SalaryStep int NOT NULL,
    PreviousSalary decimal(19,4) NOT NULL,
    BasicSalary2025 decimal(19,4) NOT NULL,
    UnpaidAmount2025 decimal(19,4) NOT NULL,
    PaidSalary2025 decimal(19,4) NOT NULL,
    BasicSalary2026 decimal(19,4) NOT NULL,
    UnpaidAmount2026 decimal(19,4) NOT NULL,
    PaidSalary2026 decimal(19,4) NOT NULL,
    UnpaidAmount2027 decimal(19,4) NOT NULL,
    PaidSalary2027 decimal(19,4) NOT NULL,
    CONSTRAINT PK_HRStaff_SalaryConversionPoints
        PRIMARY KEY (GradeCode, SalaryStep),
    CONSTRAINT UQ_HRStaff_SalaryConversionPoints_GradeSalary
        UNIQUE (GradeCode, PreviousSalary)
);
GO

CREATE INDEX IX_HRStaff_Employees_NextIncrementDate
    ON dbo.Employees (NextIncrementDate, PayCode)
    INCLUDE (FirstName, LastName, Department, WorkLocation, SalaryPoint, IncrementAmount);
GO

CREATE INDEX IX_HRStaff_Employees_Department
    ON dbo.Employees (Department, PayCode);
GO

CREATE VIEW dbo.vw_HRIncrementEmployees
AS
SELECT
    PayCode AS EmployeeNumber,
    PayCode,
    LTRIM(RTRIM(CONCAT(FirstName, ' ', LastName))) AS FullName,
    PostDescription AS Designation,
    NewGrade AS Grade,
    Department,
    WorkLocation AS Location,
    DateJoined AS AppointmentDate,
    DateOfPromotion AS PromotionDate,
    NextIncrementDate AS IncrementDate,
    PayableSalary2026 AS CurrentSalary,
    currentPoint.SalaryStep AS SalaryPoint,
    CASE
        WHEN nextPoint.SalaryStep IS NOT NULL
            THEN nextPoint.PreviousSalary - currentPoint.PreviousSalary
        ELSE IncrementAmount
    END AS IncrementAmount,
    CASE
        WHEN nextPoint.SalaryStep IS NOT NULL THEN nextPoint.BasicSalary2026
        WHEN currentPoint.SalaryStep IS NOT NULL THEN currentPoint.BasicSalary2026
        ELSE 0
    END AS ConvertedSalary,
    CASE
        WHEN nextPoint.SalaryStep IS NOT NULL THEN nextPoint.PaidSalary2026
        WHEN currentPoint.SalaryStep IS NOT NULL THEN currentPoint.PaidSalary2026
        ELSE 0
    END AS PayableSalary,
    COALESCE(StagnationAllowance, 0) AS StagnationAllowance,
    COALESCE(currentPoint.GazetteCode, SalaryScale, '') AS SalaryScale,
    CASE
        WHEN nextPoint.SalaryStep IS NOT NULL THEN 'Applied'
        WHEN currentPoint.SalaryStep IS NOT NULL THEN 'MaximumPoint'
        ELSE 'Unmatched'
    END AS SalaryConversionStatus
FROM dbo.Employees AS employee
LEFT JOIN dbo.SalaryConversionPoints AS currentPoint
    ON currentPoint.GradeCode = employee.NewGrade
    AND currentPoint.PreviousSalary = employee.SalaryPoint
OUTER APPLY
(
    SELECT TOP (1) candidate.*
    FROM dbo.SalaryConversionPoints AS candidate
    WHERE candidate.GradeCode = currentPoint.GradeCode
      AND candidate.SalaryStep > currentPoint.SalaryStep
    ORDER BY candidate.SalaryStep
) AS nextPoint;
GO
