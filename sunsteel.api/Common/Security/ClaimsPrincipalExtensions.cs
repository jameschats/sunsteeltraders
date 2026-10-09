using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace sunsteel.api.Common.Security;

public static class ClaimsPrincipalExtensions
{
    /// <summary>The signed-in user's id from the "sub" claim, or 0 when anonymous.</summary>
    public static long UserId(this ClaimsPrincipal user)
    {
        var raw = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return long.TryParse(raw, out var id) ? id : 0;
    }
}
