/*
  Deploy this view in the existing HCM database. It normalizes the vendor HCM
  schema into the stable contract consumed by the HR Increment API.

  The application login should receive SELECT permission only.
*/
CREATE OR ALTER VIEW dbo.vw_HRIncrementEmployees
AS
WITH MasterData AS
(
    SELECT
        *,
        ROW_NUMBER() OVER (PARTITION BY Number ORDER BY Number) AS RowNumber
    FROM dbo.EmployeeMasterData
)
SELECT
    LTRIM(RTRIM(e.Number)) AS EmployeeNumber,
    COALESCE(NULLIF(LTRIM(RTRIM(e.EPFNo)), ''), LTRIM(RTRIM(e.Number))) AS PayCode,
    COALESCE(
        NULLIF(LTRIM(RTRIM(e.FullName)), ''),
        NULLIF(LTRIM(RTRIM(CONCAT(e.Forenames, ' ', e.Surname))), ''),
        NULLIF(LTRIM(RTRIM(m.FullName)), ''),
        LTRIM(RTRIM(e.Number))) AS FullName,
    COALESCE(
        NULLIF(LTRIM(RTRIM(des.DesignationName)), ''),
        NULLIF(LTRIM(RTRIM(m.DesignationName)), ''),
        NULLIF(LTRIM(RTRIM(e.JobTitle)), ''),
        '') AS Designation,
    COALESCE(NULLIF(LTRIM(RTRIM(g.GradeName)), ''), NULLIF(LTRIM(RTRIM(m.GradeName)), ''), '') AS Grade,
    COALESCE(NULLIF(LTRIM(RTRIM(d.DepartmentName)), ''), NULLIF(LTRIM(RTRIM(m.CostCenter)), ''), '') AS Department,
    COALESCE(NULLIF(LTRIM(RTRIM(m.Company)), ''), NULLIF(LTRIM(RTRIM(loc.LocationName)), ''), '') AS Location,
    CONVERT(date, CASE WHEN e.DateOfAppointment < '19000101' THEN GETDATE() ELSE e.DateOfAppointment END) AS AppointmentDate,
    (
        SELECT MAX(CONVERT(date, p.DatePromoted))
        FROM dbo.hrEmpPromotions AS p
        WHERE p.EmployeeCode = e.EmployeeCode
          AND p.DatePromoted >= '19000101'
    ) AS PromotionDate,
    CONVERT(date,
        CASE
            WHEN e.DateOfAppointment < '19000101' THEN GETDATE()
            WHEN DATEADD(year, DATEDIFF(year, e.DateOfAppointment, GETDATE()), e.DateOfAppointment) < CONVERT(date, GETDATE())
                THEN DATEADD(year, DATEDIFF(year, e.DateOfAppointment, GETDATE()) + 1, e.DateOfAppointment)
            ELSE DATEADD(year, DATEDIFF(year, e.DateOfAppointment, GETDATE()), e.DateOfAppointment)
        END) AS IncrementDate,
    CAST(COALESCE(NULLIF(e.NewSalary, 0), NULLIF(e.Salary, 0), NULLIF(m.Salary, 0), 0) AS decimal(19, 4)) AS CurrentSalary
FROM dbo.MI_Employer_Employee AS e
LEFT JOIN MasterData AS m ON m.Number = e.Number AND m.RowNumber = 1
LEFT JOIN dbo.Designation AS des ON des.DesignationCode = e.DesignationCode
LEFT JOIN dbo.Grade AS g ON g.GradeCode = e.GradeCode
LEFT JOIN dbo.Department AS d ON d.DepartmentCode = e.DepartmentCode
LEFT JOIN dbo.Location AS loc ON loc.LocationCode = e.Location
WHERE e.Deleted = 0
  AND e.Status = 1
  AND NULLIF(LTRIM(RTRIM(e.Number)), '') IS NOT NULL;
GO

-- Run under an authorized DBA account after creating the read-only login/user.
-- GRANT SELECT ON dbo.vw_HRIncrementEmployees TO hr_increment_reader;
