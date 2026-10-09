using sunsteel.api.Data;
using sunsteel.api.Data.Entities;

namespace sunsteel.api.Features.Audit;

public interface IAuditService
{
    /// <summary>Queue an audit row; it is saved with the caller's next SaveChanges.</summary>
    void Record(long? userId, string action, string entity, string? entityId = null, string? summary = null);
}

public sealed class AuditService : IAuditService
{
    private readonly SunSteelDbContext _db;

    public AuditService(SunSteelDbContext db) => _db = db;

    public void Record(long? userId, string action, string entity, string? entityId = null, string? summary = null) =>
        _db.AuditLog.Add(new AuditEntry
        {
            UserId = userId,
            Action = action,
            Entity = entity,
            EntityId = entityId,
            Summary = summary is { Length: > 500 } ? summary[..500] : summary,
            At = DateTime.UtcNow,
        });
}
