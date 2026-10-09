using Microsoft.EntityFrameworkCore;
using sunsteel.api.Common.Exceptions;
using sunsteel.api.Data;
using sunsteel.api.Data.Entities;
using sunsteel.api.Features.Auth.Dtos;

namespace sunsteel.api.Features.Auth.Services;

public interface IAuthService
{
    AuthConfigResponse GetConfig();
    Task<AuthResponse> LoginAsync(LoginRequest request, string? ip, CancellationToken ct = default);
    Task<AuthResponse> GoogleAsync(GoogleLoginRequest request, string? ip, CancellationToken ct = default);
    Task<AuthResponse> RefreshAsync(RefreshRequest request, string? ip, CancellationToken ct = default);
    Task LogoutAsync(string? refreshToken, CancellationToken ct = default);
    Task<AuthUserDto> GetMeAsync(long userId, CancellationToken ct = default);
    Task ChangePasswordAsync(long userId, ChangePasswordRequest request, CancellationToken ct = default);
}

/// <summary>
/// Staff-only sign-in, ported from DailyCalendarShop's AuthService with every customer
/// path removed: no registration, no mobile/email OTP login, no auto-created accounts.
/// Google sign-in links only to an existing, active user that an admin created and allowed.
/// </summary>
public sealed class AuthService : IAuthService
{
    private const int MaxFailedLogins = 5;
    private const int MinPasswordLength = 8;
    private static readonly TimeSpan LockoutWindow = TimeSpan.FromMinutes(15);
    public const string GoogleProvider = "Google";

    private readonly SunSteelDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenService _jwt;
    private readonly IGoogleTokenValidator _google;
    private readonly IConfiguration _config;

    public AuthService(SunSteelDbContext db, IPasswordHasher hasher, IJwtTokenService jwt,
        IGoogleTokenValidator google, IConfiguration config)
    {
        _db = db;
        _hasher = hasher;
        _jwt = jwt;
        _google = google;
        _config = config;
    }

    private string? GoogleClientId =>
        string.IsNullOrWhiteSpace(_config["Google:ClientId"]) ? null : _config["Google:ClientId"];

    public AuthConfigResponse GetConfig() => new(GoogleClientId);

    public async Task<AuthResponse> LoginAsync(LoginRequest request, string? ip, CancellationToken ct = default)
    {
        var normalized = (request.Email ?? string.Empty).Trim().ToUpperInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalized, ct);

        var now = DateTime.UtcNow;
        if (user is not null && user.LockoutEndUtc is { } until && until > now)
            throw new AppException("Too many failed attempts. Try again in a few minutes.", StatusCodes.Status429TooManyRequests);

        if (user is null || string.IsNullOrEmpty(user.PasswordHash) || !_hasher.Verify(request.Password ?? "", user.PasswordHash))
        {
            if (user is not null) await RegisterFailedLoginAsync(user, now, ct);
            throw new AppException("Invalid email or password.", StatusCodes.Status401Unauthorized);
        }
        if (!user.IsActive)
            throw new AppException("Your account is disabled. Ask an administrator to re-enable it.", StatusCodes.Status403Forbidden);

        user.FailedLoginCount = 0;
        user.LockoutEndUtc = null;
        user.LastLoginAt = now;
        await _db.SaveChangesAsync(ct);
        return await IssueTokensAsync(user, ip, ct);
    }

    public async Task<AuthResponse> GoogleAsync(GoogleLoginRequest request, string? ip, CancellationToken ct = default)
    {
        var clientId = GoogleClientId
            ?? throw new AppException("Google sign-in is not configured.", StatusCodes.Status403Forbidden);

        var info = await _google.ValidateAsync(request.IdToken ?? "", clientId, ct)
            ?? throw new AppException("Google could not confirm your identity. Please try again.", StatusCodes.Status401Unauthorized);

        var link = await _db.UserExternalLogins.Include(l => l.User)
            .FirstOrDefaultAsync(l => l.Provider == GoogleProvider && l.ProviderUserId == info.Subject, ct);

        var user = link?.User;
        if (user is null)
        {
            // No self-registration: the Google account's verified email must belong to a
            // staff user an administrator has already created.
            if (string.IsNullOrEmpty(info.Email) || !info.EmailVerified)
                throw new AppException("This Google account has no verified email.", StatusCodes.Status403Forbidden);

            var normalized = info.Email.ToUpperInvariant();
            user = await _db.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalized, ct)
                ?? throw new AppException($"{info.Email} is not a Sun Steel Traders staff account.", StatusCodes.Status403Forbidden);

            _db.UserExternalLogins.Add(new UserExternalLogin
            {
                UserId = user.UserId,
                Provider = GoogleProvider,
                ProviderUserId = info.Subject,
                Email = info.Email,
                CreatedAt = DateTime.UtcNow,
            });
        }

        if (!user.IsActive)
            throw new AppException("Your account is disabled. Ask an administrator to re-enable it.", StatusCodes.Status403Forbidden);
        if (!user.AllowGoogleSignIn)
            throw new AppException("Google sign-in is turned off for this account. Use your email and password.", StatusCodes.Status403Forbidden);

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return await IssueTokensAsync(user, ip, ct);
    }

    public async Task<AuthResponse> RefreshAsync(RefreshRequest request, string? ip, CancellationToken ct = default)
    {
        var hash = _jwt.HashRefreshToken(request.RefreshToken ?? "");
        var token = await _db.RefreshTokens.Include(t => t.User).FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

        if (token is null || token.RevokedAt is not null || token.ExpiresAt < DateTime.UtcNow || token.User is null)
            throw new AppException("Your session has expired. Please sign in again.", StatusCodes.Status401Unauthorized);

        // Deactivating someone must end their access, not just block their next password login.
        if (!token.User.IsActive)
        {
            token.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            throw new AppException("This account is no longer active.", StatusCodes.Status401Unauthorized);
        }

        var response = await IssueTokensAsync(token.User, ip, ct);
        token.RevokedAt = DateTime.UtcNow;
        token.ReplacedByHash = _jwt.HashRefreshToken(response.RefreshToken);
        await _db.SaveChangesAsync(ct);
        return response;
    }

    public async Task LogoutAsync(string? refreshToken, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(refreshToken)) return;
        var hash = _jwt.HashRefreshToken(refreshToken);
        var token = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash && t.RevokedAt == null, ct);
        if (token is null) return;
        token.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<AuthUserDto> GetMeAsync(long userId, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId && u.IsActive, ct)
            ?? throw new AppException("Account not found.", StatusCodes.Status401Unauthorized);
        var (roles, perms) = await LoadAccessAsync(user.UserId, ct);
        return ToDto(user, roles, perms);
    }

    public async Task ChangePasswordAsync(long userId, ChangePasswordRequest request, CancellationToken ct = default)
    {
        var newPassword = request.NewPassword ?? "";
        if (newPassword.Length < MinPasswordLength)
            throw new AppException($"Use at least {MinPasswordLength} characters for your new password.");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId && u.IsActive, ct)
            ?? throw new AppException("Account not found.", StatusCodes.Status401Unauthorized);

        // A forced change after a temporary password still needs the temporary one, so a
        // session left open on a shared front-desk PC can't be used to take the account.
        if (!string.IsNullOrEmpty(user.PasswordHash) && !_hasher.Verify(request.CurrentPassword ?? "", user.PasswordHash))
            throw new AppException("Your current password is not correct.");
        if (!string.IsNullOrEmpty(user.PasswordHash) && _hasher.Verify(newPassword, user.PasswordHash))
            throw new AppException("Choose a password different from your current one.");

        user.PasswordHash = _hasher.Hash(newPassword);
        user.MustChangePassword = false;
        user.UpdatedAt = DateTime.UtcNow;

        foreach (var t in await _db.RefreshTokens.Where(t => t.UserId == userId && t.RevokedAt == null).ToListAsync(ct))
            t.RevokedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
    }

    // --- helpers ---

    private async Task RegisterFailedLoginAsync(User user, DateTime now, CancellationToken ct)
    {
        user.FailedLoginCount++;
        if (user.FailedLoginCount >= MaxFailedLogins)
        {
            user.LockoutEndUtc = now.Add(LockoutWindow);
            user.FailedLoginCount = 0;
        }
        user.UpdatedAt = now;
        await _db.SaveChangesAsync(ct);
    }

    private async Task<(List<string> roles, List<string> perms)> LoadAccessAsync(long userId, CancellationToken ct)
    {
        var roles = await _db.UserRoles.Where(ur => ur.UserId == userId)
            .Select(ur => ur.Role!.Name).ToListAsync(ct);

        var perms = await (
            from ur in _db.UserRoles
            where ur.UserId == userId
            join rp in _db.RolePermissions on ur.RoleId equals rp.RoleId
            join p in _db.Permissions on rp.PermissionId equals p.PermissionId
            select p.Code).Distinct().ToListAsync(ct);

        return (roles, perms);
    }

    private static AuthUserDto ToDto(User u, IReadOnlyList<string> roles, IReadOnlyList<string> perms) =>
        new(u.UserId, u.Email, u.FullName, roles, perms, u.MustChangePassword);

    private async Task<AuthResponse> IssueTokensAsync(User user, string? ip, CancellationToken ct)
    {
        var (roles, perms) = await LoadAccessAsync(user.UserId, ct);
        var (accessToken, accessExpires) = _jwt.CreateAccessToken(user, roles, perms);
        var (rawRefresh, refreshHash, refreshExpires) = _jwt.CreateRefreshToken();

        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.UserId,
            TokenHash = refreshHash,
            ExpiresAt = refreshExpires,
            CreatedByIp = ip,
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(ct);

        return new AuthResponse(accessToken, rawRefresh, accessExpires, ToDto(user, roles, perms));
    }
}
