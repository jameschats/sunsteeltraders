using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using sunsteel.api.Common.Models;
using sunsteel.api.Common.Security;
using sunsteel.api.Features.Auth.Dtos;
using sunsteel.api.Features.Auth.Services;

namespace sunsteel.api.Features.Auth;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth) => _auth = auth;

    private string? Ip => HttpContext.Connection.RemoteIpAddress?.ToString();

    /// <summary>Public: whether Google sign-in is available, and its client id.</summary>
    [HttpGet("config")]
    public IActionResult Config() => Ok(ApiResponse<AuthConfigResponse>.Ok(_auth.GetConfig()));

    [EnableRateLimiting("auth")]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken ct)
        => Ok(ApiResponse<AuthResponse>.Ok(await _auth.LoginAsync(request, Ip, ct)));

    [EnableRateLimiting("auth")]
    [HttpPost("google")]
    public async Task<IActionResult> Google(GoogleLoginRequest request, CancellationToken ct)
        => Ok(ApiResponse<AuthResponse>.Ok(await _auth.GoogleAsync(request, Ip, ct)));

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(RefreshRequest request, CancellationToken ct)
        => Ok(ApiResponse<AuthResponse>.Ok(await _auth.RefreshAsync(request, Ip, ct)));

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(LogoutRequest request, CancellationToken ct)
    {
        await _auth.LogoutAsync(request.RefreshToken, ct);
        return Ok(ApiResponse<object>.Ok(new { signedOut = true }));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct)
        => Ok(ApiResponse<AuthUserDto>.Ok(await _auth.GetMeAsync(User.UserId(), ct)));

    [Authorize]
    [EnableRateLimiting("auth")]
    [HttpPost("password/change")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request, CancellationToken ct)
    {
        await _auth.ChangePasswordAsync(User.UserId(), request, ct);
        return Ok(ApiResponse<object>.Ok(new { changed = true }, "Password updated. Please sign in again."));
    }
}
