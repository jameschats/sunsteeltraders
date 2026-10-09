namespace sunsteel.api.Features.Site;

public sealed record ThemeDto(string Primary, string Accent, string Surface);

/// <summary>Everything the public site needs at start-up, in one cached call.</summary>
public sealed record SiteDto(IReadOnlyDictionary<string, string?> Settings, ThemeDto Theme);

public sealed record UpdateSettingsRequest(Dictionary<string, string?> Settings);
