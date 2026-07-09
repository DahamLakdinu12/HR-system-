namespace HRIncrement.Application.DTOs;

public sealed record AssessmentFormDto(
    string EmployeeNumber,
    string PayCode,
    string EmployeeName,
    string Designation,
    string Grade,
    string Department,
    string Location,
    DateOnly AppointmentDate,
    DateOnly? PromotionDate,
    DateOnly IncrementDate,
    decimal CurrentSalary,
    decimal PresentBasicSalary,
    decimal PresentPayableSalary,
    int? SalaryPoint,
    decimal IncrementAmount,
    decimal ConvertedSalary,
    decimal PayableSalary,
    string GazetteReference,
    AssessmentLeaveParticularsDto? LeaveParticulars = null,
    bool IsStagnationIncrement = false);

public sealed record AssessmentLeaveParticularsDto(
    AssessmentLeavePeriodDto? PreviousYear = null,
    AssessmentLeavePeriodDto? CurrentYear = null);

public sealed record AssessmentLeavePeriodDto(
    string? Casual = null,
    string? Vacation = null,
    string? Sick = null,
    string? NoPay = null,
    string? LateAttendance = null);
