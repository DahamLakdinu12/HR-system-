using System.Net.Http.Headers;
using System.Text.Json;
using HRIncrement.Application.DTOs;
using HRIncrement.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HRIncrement.Infrastructure.HcmIntegration;

internal sealed class HcmLeaveParticularsProvider(
    HttpClient httpClient,
    IConfiguration configuration,
    ILogger<HcmLeaveParticularsProvider> logger) : IAssessmentLeaveParticularsProvider
{
    private readonly HcmLeaveApiOptions _options = ReadOptions(configuration);

    public async Task<AssessmentLeaveParticularsDto?> GetLeaveParticularsAsync(
        AssessmentFormDto assessment,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.BaseUrl))
            return null;

        try
        {
            using var request = new HttpRequestMessage(
                HttpMethod.Get,
                BuildLeaveParticularsUri(assessment));
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            if (!string.IsNullOrWhiteSpace(_options.ApiKey))
                request.Headers.TryAddWithoutValidation(_options.ApiKeyHeaderName, _options.ApiKey);

            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(_options.TimeoutSeconds));
            using var linkedCancellation = CancellationTokenSource.CreateLinkedTokenSource(
                cancellationToken,
                timeout.Token);

            using var response = await httpClient.SendAsync(request, linkedCancellation.Token);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "HCM leave API returned {StatusCode} for pay code {PayCode}. Assessment PDF will use blank leave placeholders.",
                    response.StatusCode,
                    assessment.PayCode);
                return null;
            }

            await using var stream = await response.Content.ReadAsStreamAsync(linkedCancellation.Token);
            return await ReadLeaveParticularsAsync(stream, linkedCancellation.Token);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(
                "HCM leave API timed out for pay code {PayCode}. Assessment PDF will use blank leave placeholders.",
                assessment.PayCode);
            return null;
        }
        catch (Exception exception)
        {
            logger.LogWarning(
                exception,
                "HCM leave API failed for pay code {PayCode}. Assessment PDF will use blank leave placeholders.",
                assessment.PayCode);
            return null;
        }
    }

    private static HcmLeaveApiOptions ReadOptions(IConfiguration configuration)
    {
        var section = configuration.GetSection(HcmLeaveApiOptions.SectionName);
        var timeoutSeconds = int.TryParse(section["TimeoutSeconds"], out var timeout) && timeout > 0
            ? timeout
            : 15;

        return new HcmLeaveApiOptions
        {
            BaseUrl = section["BaseUrl"] ?? string.Empty,
            LeaveParticularsPath = section["LeaveParticularsPath"] ?? "/api/leaves/increment-assessment",
            ApiKey = section["ApiKey"] ?? string.Empty,
            ApiKeyHeaderName = string.IsNullOrWhiteSpace(section["ApiKeyHeaderName"])
                ? "X-API-Key"
                : section["ApiKeyHeaderName"]!,
            TimeoutSeconds = timeoutSeconds
        };
    }

    private Uri BuildLeaveParticularsUri(AssessmentFormDto assessment)
    {
        var leavePeriodEnd = assessment.IncrementDate.AddMonths(-1).AddDays(-1);
        var leavePeriodStart = leavePeriodEnd.AddYears(-1).AddDays(1);
        var baseUri = new Uri(_options.BaseUrl.TrimEnd('/') + "/");
        var path = _options.LeaveParticularsPath.TrimStart('/');
        var builder = new UriBuilder(new Uri(baseUri, path))
        {
            Query = string.Join('&',
                QueryParameter("employeeNumber", assessment.EmployeeNumber),
                QueryParameter("payCode", assessment.PayCode),
                QueryParameter("incrementDate", assessment.IncrementDate.ToString("yyyy-MM-dd")),
                QueryParameter("periodFrom", leavePeriodStart.ToString("yyyy-MM-dd")),
                QueryParameter("periodTo", leavePeriodEnd.ToString("yyyy-MM-dd")))
        };

        return builder.Uri;
    }

    private static string QueryParameter(string name, string value) =>
        $"{Uri.EscapeDataString(name)}={Uri.EscapeDataString(value)}";

    private static async Task<AssessmentLeaveParticularsDto?> ReadLeaveParticularsAsync(
        Stream stream,
        CancellationToken cancellationToken)
    {
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        var root = document.RootElement;
        if (root.ValueKind == JsonValueKind.Object && TryGetProperty(root, out var data, "data", "result"))
            root = data;

        if (root.ValueKind != JsonValueKind.Object)
            return null;

        return new AssessmentLeaveParticularsDto(
            ReadPeriod(root, "previousYear", "previous_year", "previous"),
            ReadPeriod(root, "currentYear", "current_year", "current"));
    }

    private static AssessmentLeavePeriodDto? ReadPeriod(JsonElement root, params string[] names)
    {
        if (!TryGetProperty(root, out var period, names) || period.ValueKind != JsonValueKind.Object)
            return null;

        return new AssessmentLeavePeriodDto(
            ReadValue(period, "casual", "casualLeave"),
            ReadValue(period, "vacation", "vacationLeave", "annualLeave"),
            ReadValue(period, "sick", "sickLeave"),
            ReadValue(period, "noPay", "no_pay", "nopay", "noPayLeave"),
            ReadValue(period, "lateAttendance", "late_attendance", "late"));
    }

    private static bool TryGetProperty(JsonElement element, out JsonElement value, params string[] names)
    {
        foreach (var property in element.EnumerateObject())
        {
            if (names.Any(name => string.Equals(property.Name, name, StringComparison.OrdinalIgnoreCase)))
            {
                value = property.Value;
                return true;
            }
        }

        value = default;
        return false;
    }

    private static string? ReadValue(JsonElement element, params string[] names)
    {
        if (!TryGetProperty(element, out var value, names) || value.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined)
            return null;

        return value.ValueKind switch
        {
            JsonValueKind.String => value.GetString(),
            JsonValueKind.Number => value.GetRawText(),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            _ => value.GetRawText()
        };
    }
}
