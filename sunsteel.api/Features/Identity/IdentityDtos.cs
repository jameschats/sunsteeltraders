namespace sunsteel.api.Features.Identity;

public sealed record StaffUserDto(
    long UserId, string Email, string? FullName, string? PhoneNumber,
    long? RoleId, string? RoleName, bool IsActive, bool AllowGoogleSignIn,
    bool MustChangePassword, DateTime? LastLoginAt, DateTime CreatedAt);

public sealed record CreateStaffUserRequest(
    string Email, string? FullName, string? PhoneNumber, long RoleId,
    string TemporaryPassword, bool AllowGoogleSignIn = true);

public sealed record UpdateStaffUserRequest(
    string? FullName, string? PhoneNumber, long RoleId, bool IsActive, bool AllowGoogleSignIn);

public sealed record ResetStaffPasswordRequest(string TemporaryPassword);

public sealed record RoleDto(long RoleId, string Name, string? Description, IReadOnlyList<string> Permissions);
