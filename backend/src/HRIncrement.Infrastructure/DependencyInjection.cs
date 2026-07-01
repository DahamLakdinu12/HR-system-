using HRIncrement.Application.Interfaces;
using HRIncrement.Infrastructure.Data;
using HRIncrement.Infrastructure.HcmIntegration;
using HRIncrement.Infrastructure.PdfGeneration;
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
        var hcmConnection = configuration.GetConnectionString("HcmDatabase")
            ?? throw new InvalidOperationException("ConnectionStrings:HcmDatabase is required.");
        var hrStaffConnection = configuration.GetConnectionString("HrStaffDatabase")
            ?? throw new InvalidOperationException("ConnectionStrings:HrStaffDatabase is required.");

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(applicationConnection, sql => sql.EnableRetryOnFailure()));
        services.AddDbContext<HcmDbContext>(options =>
            options.UseSqlServer(hcmConnection, sql => sql.EnableRetryOnFailure()));
        services.AddDbContext<HrStaffDbContext>(options =>
            options.UseSqlServer(hrStaffConnection, sql => sql.EnableRetryOnFailure()));
        services.AddScoped<IHcmEmployeeReader, HcmEmployeeReader>();
        services.AddScoped<IIncrementWorkflowService, IncrementWorkflowService>();
        services.AddScoped<IAssessmentPdfGenerator, AssessmentPdfGenerator>();
        return services;
    }
}
