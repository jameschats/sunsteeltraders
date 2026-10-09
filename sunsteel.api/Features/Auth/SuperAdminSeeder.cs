using Microsoft.EntityFrameworkCore;
using sunsteel.api.Data;
using sunsteel.api.Features.Auth.Services;

namespace sunsteel.api.Features.Auth;

/// <summary>
/// Migration 003 creates the first Super Admin with a placeholder hash. On API start this
/// swaps it for a real BCrypt hash of <c>Admin:DefaultPassword</c>. The account is flagged
/// MustChangePassword, so the seed password only ever works once.
/// </summary>
public sealed class SuperAdminSeeder : IHostedService
{
    public const string PlaceholderHash = "SET_BY_SEEDER";

    private readonly IServiceProvider _services;
    private readonly IConfiguration _config;
    private readonly ILogger<SuperAdminSeeder> _logger;

    public SuperAdminSeeder(IServiceProvider services, IConfiguration config, ILogger<SuperAdminSeeder> logger)
    {
        _services = services;
        _config = config;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken ct)
    {
        using var scope = _services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SunSteelDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        var email = (_config["Admin:Email"] ?? "admin@sunsteeltraders.com").Trim().ToUpperInvariant();
        var password = _config["Admin:DefaultPassword"];

        try
        {
            var admin = await db.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == email, ct);
            if (admin is null || admin.PasswordHash != PlaceholderHash) return;

            if (string.IsNullOrWhiteSpace(password))
            {
                _logger.LogWarning("Admin:DefaultPassword is not set; {Email} cannot sign in until it is.", admin.Email);
                return;
            }

            admin.PasswordHash = hasher.Hash(password);
            admin.MustChangePassword = true;
            admin.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            _logger.LogWarning("Seeded {Email} with Admin:DefaultPassword. It must be changed at first sign-in.", admin.Email);
        }
        catch (Exception ex)
        {
            // A missing database should not stop the API starting; /api/health/ready reports it.
            _logger.LogError(ex, "Could not seed the Super Admin. Have the migrations been applied?");
        }
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
