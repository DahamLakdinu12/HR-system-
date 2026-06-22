/*
  Deploy this view in the existing HCM database after mapping the source columns
  to the vendor schema. The application login must receive SELECT permission only.
*/
CREATE OR ALTER VIEW dbo.vw_HRIncrementEmployees
AS
SELECT
    e.EmployeeNumber,
    e.PayCode,
    e.FullName,
    e.Designation,
    e.Grade,
    e.Department,
    e.Location,
    e.AppointmentDate,
    e.PromotionDate,
    e.IncrementDate,
    CAST(e.CurrentSalary AS decimal(19, 4)) AS CurrentSalary
FROM dbo.Employees AS e
WHERE e.IsActive = 1;
GO

-- Run under an authorized DBA account after creating the read-only login/user.
-- GRANT SELECT ON dbo.vw_HRIncrementEmployees TO hr_increment_reader;
