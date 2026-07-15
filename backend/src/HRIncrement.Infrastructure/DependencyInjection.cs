using HRIncrement.Application.Interfaces;
using HRIncrement.Infrastructure.Data;
using HRIncrement.Infrastructure.Employees;
using HRIncrement.Infrastructure.HcmIntegration;
using HRIncrement.Infrastructure.PdfGeneration;
using HRIncrement.Infrastructure.Reports;
using HRIncrement.Infrastructure.Workflows;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HRIncrement.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var applicationConnection = configuration.GetConnectionString("ApplicationDatabase")
            ?? throw new InvalidOperationException("ConnectionStrings:ApplicationDatabase is required.");
        var hrStaffConnection = configuration.GetConnectionString("HrStaffDatabase")
            ?? throw new InvalidOperationException("ConnectionStrings:HrStaffDatabase is required.");

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(applicationConnection, sql => sql.EnableRetryOnFailure()));
        services.AddDbContext<HrStaffDbContext>(options =>
            options.UseSqlServer(hrStaffConnection, sql => sql.EnableRetryOnFailure()));
        services.AddSingleton<HttpClient>();
        services.AddScoped<IEmployeeReader, HrStaffEmployeeReader>();
        services.AddScoped<IEmployeeHistoryService, EmployeeHistoryService>();
        services.AddScoped<IAssessmentLeaveParticularsProvider, HcmLeaveParticularsProvider>();
        services.AddScoped<IIncrementWorkflowService, IncrementWorkflowService>();
        services.AddScoped<ReportDataReader>();
        services.AddScoped<IReportsService, ReportsService>();
        services.AddScoped<IAssessmentPdfGenerator, AssessmentPdfGenerator>();
        return services;
    }
}
