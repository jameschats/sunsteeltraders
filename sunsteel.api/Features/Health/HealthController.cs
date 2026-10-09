using Microsoft.AspNetCore.Mvc;
using sunsteel.api.Common.Models;

namespace sunsteel.api.Features.Health;

[ApiController]
[Route("api/health")]
public sealed class HealthController : ControllerBase
{
    /// <summary>Liveness: the process is up. Readiness (DB) is at /api/health/ready.</summary>
    [HttpGet]
    public IActionResult Get() => Ok(ApiResponse<object>.Ok(new { status = "ok", at = DateTime.UtcNow }));
}
