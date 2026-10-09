namespace sunsteel.api.Data.Entities;

/// <summary>Key/value site setting (migration 004).</summary>
public sealed class SiteSetting
{
    public string SettingKey { get; set; } = string.Empty;
    public string? SettingValue { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>Theme colour (migration 004): PrimaryColor, AccentColor, SurfaceColor.</summary>
public sealed class ThemeSetting
{
    public string SettingKey { get; set; } = string.Empty;
    public string? SettingValue { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>Admin change history (migration 009).</summary>
public sealed class AuditEntry
{
    public long AuditId { get; set; }
    public long? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Entity { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string? Summary { get; set; }
    public DateTime At { get; set; }
}
