using Microsoft.AspNetCore.Authorization;

namespace Rms.Api.Security;

public sealed class RequirePermissionAttribute : AuthorizeAttribute
{
    public RequirePermissionAttribute(string permissionCode)
    {
        Policy = PermissionPolicyProvider.PolicyPrefix + permissionCode;
    }
}
