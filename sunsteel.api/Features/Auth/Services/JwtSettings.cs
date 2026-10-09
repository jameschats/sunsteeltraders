namespace sunsteel.api.Features.Auth.Services;

public sealed class JwtSettings
{
    public string Issuer { get; set; } = "sunsteel.api";
    public string Audience { get; set; } = "sunsteel.web";
    public string Key { get; set; } = string.Empty;
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 14;
}
