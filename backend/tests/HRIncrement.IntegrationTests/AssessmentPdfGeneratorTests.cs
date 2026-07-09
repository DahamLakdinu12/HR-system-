using System.Text;
using System.Text.RegularExpressions;
using HRIncrement.Application.DTOs;
using HRIncrement.Application.Interfaces;
using HRIncrement.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using QuestPDF.Infrastructure;
using Xunit;

namespace HRIncrement.IntegrationTests;

public sealed class AssessmentPdfGeneratorTests
{
    [Fact]
    public void AssessmentPdf_IncludesFinanceSlipPage()
    {
        QuestPDF.Settings.License = LicenseType.Evaluation;

        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:ApplicationDatabase"] = "Server=localhost,1433;Database=HRIncrement;User Id=sa;Password=YourStrong@Pass123;Encrypt=True;TrustServerCertificate=True",
                ["ConnectionStrings:HcmDatabase"] = "Server=localhost,1433;Database=HCM8;User Id=sa;Password=YourStrong@Pass123;Encrypt=True;TrustServerCertificate=True;ApplicationIntent=ReadOnly",
                ["ConnectionStrings:HrStaffDatabase"] = "Server=localhost,1433;Database=HRStaff;User Id=sa;Password=YourStrong@Pass123;Encrypt=True;TrustServerCertificate=True;ApplicationIntent=ReadOnly",
            })
            .Build();

        services.AddInfrastructure(configuration);
        using var provider = services.BuildServiceProvider();

        var generator = provider.GetRequiredService<IAssessmentPdfGenerator>();
        var pdf = generator.Generate(new AssessmentFormDto(
            "3281",
            "3281",
            "T S M ARACHCHI",
            "Administrative Officer",
            "MA-2-2-II",
            "Finance",
            "WTC",
            new DateOnly(1994, 3, 28),
            null,
            new DateOnly(2026, 9, 12),
            47533m,
            56570m,
            52051.5m,
            1,
            630m,
            57200m,
            52583.5m,
            "Rs. 56,570 - 6 x 630, 14 x 1080 - 75,470",
            null,
            false));

        var pdfText = Encoding.Latin1.GetString(pdf);
        var pageCount = Regex.Matches(pdfText, @"/Type\s*/Page\b").Count;

        Assert.True(pageCount >= 2, $"Expected at least 2 pages, but found {pageCount}.");
    }
}
