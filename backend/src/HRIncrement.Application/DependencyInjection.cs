using HRIncrement.Application.Interfaces;
using HRIncrement.Application.Services;
using HRIncrement.Domain.Rules;
using Microsoft.Extensions.DependencyInjection;

namespace HRIncrement.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddSingleton(TimeProvider.System);
        services.AddScoped<SalaryCalculationEngine>();
        services.AddScoped<IIncrementCalculationService, IncrementCalculationService>();
        return services;
    }
}
