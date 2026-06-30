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
    decimal IncrementAmount,
    decimal PayableSalary,
    string GazetteReference);
