namespace HRIncrement.Application.DTOs;

public sealed record EmployeeDto(
    string EmployeeNumber,
    string PayCode,
    string FullName,
    string Designation,
    string Grade,
    string Department,
    string Location,
    DateOnly AppointmentDate,
    DateOnly? PromotionDate,
    DateOnly IncrementDate,
    decimal CurrentSalary);
