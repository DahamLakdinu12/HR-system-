using HRIncrement.Application.DTOs;

namespace HRIncrement.Application.Interfaces;

public interface IReportsService
{
    Task<MonthlyReportSummaryDto> GetMonthlySummaryAsync(
        EmployeeDataSource dataSource,
        int year,
        int month,
        CancellationToken cancellationToken);

    Task<ReportDocumentDto> GenerateIncrementRegisterAsync(
        EmployeeDataSource dataSource,
        int year,
        int month,
        CancellationToken cancellationToken);

    Task<ReportDocumentDto> GenerateApprovalReportAsync(
        EmployeeDataSource dataSource,
        int year,
        int month,
        CancellationToken cancellationToken);
}
