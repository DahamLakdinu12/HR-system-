/*
  Deploy this view in the existing HCM database. It normalizes the vendor HCM
  schema into the stable contract consumed by the HR Increment API.

  The application login should receive SELECT permission only.
*/
CREATE OR ALTER VIEW dbo.vw_HRIncrementEmployees
AS
SELECT
    LTRIM(RTRIM(e.Number)) AS EmployeeNumber,
    COALESCE(NULLIF(LTRIM(RTRIM(e.EPFNo)), ''), LTRIM(RTRIM(e.Number))) AS PayCode,
    COALESCE(
        NULLIF(LTRIM(RTRIM(
            CASE
                WHEN LOWER(LTRIM(RTRIM(e.FullName))) LIKE 'n/a %'
                    THEN SUBSTRING(LTRIM(RTRIM(e.FullName)), 5, 4000)
                WHEN LOWER(LTRIM(RTRIM(e.FullName))) IN ('n/a', 'na')
                    THEN ''
                ELSE e.FullName
            END)), ''),
        NULLIF(LTRIM(RTRIM(CONCAT(
            CASE
                WHEN LOWER(LTRIM(RTRIM(e.Forenames))) IN ('n/a', 'na') THEN ''
                ELSE e.Forenames
            END,
            ' ',
            e.Surname))), ''),
        LTRIM(RTRIM(e.Number))) AS FullName,
    COALESCE(
        NULLIF(LTRIM(RTRIM(details.Designation)), ''),
        NULLIF(LTRIM(RTRIM(des.DesignationName)), ''),
        NULLIF(LTRIM(RTRIM(e.JobTitle)), ''),
        '') AS Designation,
    COALESCE(NULLIF(LTRIM(RTRIM(g.GradeName)), ''), '') AS Grade,
    COALESCE(
        NULLIF(LTRIM(RTRIM(details.Department)), ''),
        NULLIF(LTRIM(RTRIM(org4.Name)), ''),
        NULLIF(LTRIM(RTRIM(d.DepartmentName)), ''),
        '') AS Department,
    COALESCE(
        NULLIF(LTRIM(RTRIM(details.Location)), ''),
        NULLIF(LTRIM(RTRIM(org2.Name)), ''),
        NULLIF(LTRIM(RTRIM(loc.LocationName)), ''),
        '') AS Location,
    CONVERT(date, CASE WHEN e.DateOfAppointment < '19000101' THEN GETDATE() ELSE e.DateOfAppointment END) AS AppointmentDate,
    latestPromotion.EffectDate AS PromotionDate,
    CONVERT(date,
        CASE
            WHEN e.DateOfAppointment < '19000101' THEN GETDATE()
            WHEN DATEADD(year, DATEDIFF(year, e.DateOfAppointment, GETDATE()), e.DateOfAppointment) < CONVERT(date, GETDATE())
                THEN DATEADD(year, DATEDIFF(year, e.DateOfAppointment, GETDATE()) + 1, e.DateOfAppointment)
            ELSE DATEADD(year, DATEDIFF(year, e.DateOfAppointment, GETDATE()), e.DateOfAppointment)
        END) AS IncrementDate,
    CAST(COALESCE(NULLIF(e.NewSalary, 0), NULLIF(e.Salary, 0), 0) AS decimal(19, 4)) AS CurrentSalary
FROM dbo.MI_Employer_Employee AS e
LEFT JOIN dbo.View_EmployeeDet AS details ON details.Number = e.Number
LEFT JOIN dbo.Designation AS des ON des.DesignationCode = e.DesignationCode
LEFT JOIN dbo.MI_eprf_hrGrade AS g ON g.GradeCode = e.GradeCode
LEFT JOIN dbo.Department AS d ON d.DepartmentCode = e.DepartmentCode
LEFT JOIN dbo.Location AS loc ON loc.LocationCode = e.Location
LEFT JOIN dbo.MI_eprf_hrOrgLevel2 AS org2 ON org2.Level2Code = e.Level2Code
LEFT JOIN dbo.MI_eprf_hrOrgLevel4 AS org4 ON org4.Level4Code = e.Level4Code
OUTER APPLY
(
    SELECT TOP (1)
        CONVERT(date, promotion.EffectDate) AS EffectDate
    FROM dbo.MI_eprf_hrEmployeePromotionRequest AS promotion
    WHERE promotion.EmployeeCode = e.EmployeeCode
    ORDER BY promotion.EffectDate DESC, promotion.AutoID DESC
) AS latestPromotion
WHERE e.Deleted = 0
  AND e.Status = 1
  AND NULLIF(LTRIM(RTRIM(e.Number)), '') IS NOT NULL;
GO

-- Run under an authorized DBA account after creating the read-only login/user.
-- GRANT SELECT ON dbo.vw_HRIncrementEmployees TO hr_increment_reader;
