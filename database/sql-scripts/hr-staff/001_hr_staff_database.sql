IF DB_ID(N'HRStaff') IS NULL
BEGIN
    CREATE DATABASE HRStaff;
END;
GO

USE HRStaff;
GO

DROP VIEW IF EXISTS dbo.vw_HRIncrementEmployees;
DROP TABLE IF EXISTS dbo.Employees;
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
    NearestPolice nvarchar(200) NULL,
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
    SalaryPoint AS CurrentSalary,
    IncrementAmount,
    COALESCE(StagnationAllowance, 0) AS StagnationAllowance,
    COALESCE(SalaryScale, '') AS SalaryScale
FROM dbo.Employees;
GO
