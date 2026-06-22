using Xunit;

namespace HRIncrement.ArchitectureTests;

public sealed class ArchitectureDependencyTests
{
    [Fact]
    public void Domain_DoesNotReferenceOuterLayers()
    {
        var references = typeof(Domain.Entities.Gazette).Assembly.GetReferencedAssemblies();

        Assert.DoesNotContain(references, x => x.Name is "HRIncrement.Application" or "HRIncrement.Infrastructure" or "HRIncrement.Api");
    }

    [Fact]
    public void Application_DoesNotReferenceInfrastructureOrApi()
    {
        var references = typeof(Application.DependencyInjection).Assembly.GetReferencedAssemblies();

        Assert.DoesNotContain(references, x => x.Name is "HRIncrement.Infrastructure" or "HRIncrement.Api");
    }
}
