using System.Globalization;
using HRIncrement.Application.DTOs;
using HRIncrement.Application.Interfaces;

namespace HRIncrement.Infrastructure.Reports;

internal sealed class ReportsService(ReportDataReader dataReader) : IReportsService
{
    public async Task<MonthlyReportSummaryDto> GetMonthlySummaryAsync(
        EmployeeDataSource dataSource,
        int year,
        int month,
        CancellationToken cancellationToken)
    {
        var increments = await dataReader.GetIncrementRowsAsync(
            dataSource, year, month, cancellationToken);
        var decisions = await dataReader.GetDecisionRowsAsync(
            dataSource, year, month, cancellationToken);
        var approved = decisions.Where(row => row.Approved)
            .Select(row => row.PayCode).Distinct().Count();
        var declined = decisions.Where(row => !row.Approved)
            .Select(row => row.PayCode).Distinct().Count();
        var totalDecided = approved + declined;

        return new MonthlyReportSummaryDto(
            year,
            month,
            MonthLabel(year, month),
            increments.Count,
            increments.Sum(row => row.IncrementAmount),
            increments.Sum(row => row.PayableSalary),
            approved,
            declined,
            totalDecided == 0 ? 0 : decimal.Round(approved * 100m / totalDecided, 1));
    }

    public async Task<ReportDocumentDto> GenerateIncrementRegisterAsync(
        EmployeeDataSource dataSource,
        int year,
        int month,
        CancellationToken cancellationToken)
    {
        var rows = await dataReader.GetIncrementRowsAsync(
            dataSource, year, month, cancellationToken);
        return new ReportDocumentDto(
            IncrementRegisterPdfGenerator.Generate(
                MonthLabel(year, month),
                SourceLabel(dataSource),
                rows),
            $"increment-register-{year}-{month:00}.pdf");
    }

    public async Task<ReportDocumentDto> GenerateApprovalReportAsync(
        EmployeeDataSource dataSource,
        int year,
        int month,
        CancellationToken cancellationToken)
    {
        var rows = await dataReader.GetDecisionRowsAsync(
            dataSource, year, month, cancellationToken);
        return new ReportDocumentDto(
            MonthlyApprovalPdfGenerator.Generate(
                MonthLabel(year, month),
                SourceLabel(dataSource),
                rows),
            $"approval-report-{year}-{month:00}.pdf");
    }

    private static string MonthLabel(int year, int month)
    {
        ReportDataReader.MonthRange(year, month);
        return new DateTime(year, month, 1)
            .ToString("MMMM yyyy", CultureInfo.GetCultureInfo("en-LK"));
    }

    private static string SourceLabel(EmployeeDataSource dataSource) =>
        dataSource == EmployeeDataSource.Hcm ? "HCM database" : "HR staff database";
}
