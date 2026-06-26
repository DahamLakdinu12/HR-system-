using HRIncrement.Api.Extensions;
using HRIncrement.Api.Middleware;
using HRIncrement.Application;
using HRIncrement.Infrastructure;
using QuestPDF.Infrastructure;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "HRIncrement.Api")
    .WriteTo.Console());

builder.Services
    .AddApplication()
    .AddInfrastructure(builder.Configuration)
    .AddApiServices(builder.Configuration, builder.Environment);

var questPdfLicense = builder.Configuration["QuestPdf:License"];
if (Enum.TryParse<LicenseType>(questPdfLicense, true, out var license))
    QuestPDF.Settings.License = license;

var app = builder.Build();

app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseSerilogRequestLogging();
app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment()) app.MapOpenApi();

app.MapControllers();
app.MapHealthChecks("/health");
app.Run();

public partial class Program;
