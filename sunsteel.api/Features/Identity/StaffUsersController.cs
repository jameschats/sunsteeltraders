using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using sunsteel.api.Common.Models;
using sunsteel.api.Common.Security;

namespace sunsteel.api.Features.Identity;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = Perm.UserManage)]
public sealed class StaffUsersController : ControllerBase
{
    private readonly IStaffUserService _users;

    public StaffUsersController(IStaffUserService users) => _users = users;

    [HttpGet("users")]
    public async Task<IActionResult> List(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<StaffUserDto>>.Ok(await _users.ListAsync(ct)));

    [HttpPost("users")]
    public async Task<IActionResult> Create(CreateStaffUserRequest request, CancellationToken ct)
        => Ok(ApiResponse<StaffUserDto>.Ok(await _users.CreateAsync(User.UserId(), request, ct), "Staff user created."));

    [HttpPut("users/{id:long}")]
    public async Task<IActionResult> Update(long id, UpdateStaffUserRequest request, CancellationToken ct)
        => Ok(ApiResponse<StaffUserDto>.Ok(await _users.UpdateAsync(User.UserId(), id, request, ct), "Saved."));

    [HttpPost("users/{id:long}/reset-password")]
    public async Task<IActionResult> ResetPassword(long id, ResetStaffPasswordRequest request, CancellationToken ct)
    {
        await _users.ResetPasswordAsync(User.UserId(), id, request.TemporaryPassword, ct);
        return Ok(ApiResponse<object>.Ok(new { reset = true }, "Temporary password set. They'll choose a new one at sign-in."));
    }

    /// <summary>The three seeded roles and what each may do.</summary>
    [HttpGet("roles")]
    public async Task<IActionResult> Roles(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<RoleDto>>.Ok(await _users.ListRolesAsync(ct)));
}
