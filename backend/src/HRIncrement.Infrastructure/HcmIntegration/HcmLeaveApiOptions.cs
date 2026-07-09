namespace HRIncrement.Infrastructure.HcmIntegration;

internal sealed class HcmLeaveApiOptions
{
    public const string SectionName = "HcmLeaveApi";

    public string BaseUrl { get; init; } = string.Empty;
    public string LeaveParticularsPath { get; init; } = "/api/leaves/increment-assessment";
    public string ApiKey { get; init; } = string.Empty;
    public string ApiKeyHeaderName { get; init; } = "X-API-Key";
    public int TimeoutSeconds { get; init; } = 15;
}
