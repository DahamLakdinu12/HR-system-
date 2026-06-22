using HRIncrement.Api.Controllers;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace HRIncrement.IntegrationTests;

public sealed class ApiCompositionTests
{
    [Fact]
    public void Controllers_AreApiControllersWithVersionedRoutes()
    {
        var controllers = new[] { typeof(EmployeesController), typeof(IncrementsController) };

        Assert.All(controllers, controller =>
        {
            Assert.NotNull(controller.GetCustomAttributes(typeof(ApiControllerAttribute), inherit: true).SingleOrDefault());
            var route = Assert.Single(controller.GetCustomAttributes(typeof(RouteAttribute), inherit: true).Cast<RouteAttribute>());
            Assert.StartsWith("api/v1/", route.Template, StringComparison.Ordinal);
        });
    }
}
