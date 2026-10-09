namespace sunsteel.api.Features.Auth.Dtos;

// --- Requests ---
public sealed record LoginRequest(string Email, string Password);
public sealed record GoogleLoginRequest(string IdToken);
public sealed record RefreshRequest(string RefreshToken);
public sealed record LogoutRequest(string? RefreshToken);
public sealed record ChangePasswordRequest(string? CurrentPassword, string NewPassword);

// --- Responses ---
public sealed record AuthUserDto(
    long UserId,
    string Email,
    string? FullName,
    IReadOnlyList<string> Roles,
    IReadOnlyList<string> Permissions,
    bool MustChangePassword);

public sealed record AuthResponse(string AccessToken, string RefreshToken, DateTime ExpiresAtUtc, AuthUserDto User);

/// <summary>What the admin login page needs before anyone signs in.</summary>
public sealed record AuthConfigResponse(string? GoogleClientId);
