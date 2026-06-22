/* Create only after confirming an equivalent index does not exist in HCM. */
CREATE INDEX IX_Employees_IncrementDate_EmployeeNumber
ON dbo.Employees (IncrementDate, EmployeeNumber)
INCLUDE (PayCode, FullName, Designation, Grade, Department, Location, CurrentSalary)
WHERE IsActive = 1;
GO
