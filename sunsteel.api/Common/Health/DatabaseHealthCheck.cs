using Microsoft.Extensions.Diagnostics.HealthChecks;
using sunsteel.api.Data;

namespace sunsteel.api.Common.Health;

/// <summary>Readiness probe: healthy only when MySQL answers.</summary>
public sealed class DatabaseHealthCheck : IHealthCheck
{
    private readonly SunSteelDbContext _db;

    public DatabaseHealthCheck(SunSteelDbContext db) => _db = db;

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken ct = default)
        => await _db.Database.CanConnectAsync(ct)
            ? HealthCheckResult.Healthy()
            : HealthCheckResult.Unhealthy("Database unreachable");
}
