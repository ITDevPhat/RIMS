using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Rms.Infrastructure.Persistence;
using Rms.Infrastructure.Persistence.Entities;
using Rms.Infrastructure.Security;

namespace Rms.Infrastructure.Services;

public sealed class DevelopmentAdminSeeder
{
    private readonly RmsDbContext _dbContext;
    private readonly IPasswordService _passwordService;
    private readonly IConfiguration _configuration;

    public DevelopmentAdminSeeder(RmsDbContext dbContext, IPasswordService passwordService, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _passwordService = passwordService;
        _configuration = configuration;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var username = _configuration["DevelopmentAdmin:Username"] ?? "admin";
        var email = _configuration["DevelopmentAdmin:Email"] ?? "admin@hospital.vn";
        var password = _configuration["DevelopmentAdmin:Password"] ?? "demo123";

        await EnsureRequiredPermissionsAsync(cancellationToken);

        var adminRole = await _dbContext.Roles.FirstOrDefaultAsync(x => x.RoleCode == "ADMIN", cancellationToken);
        if (adminRole is null)
        {
            adminRole = new Role
            {
                RoleCode = "ADMIN",
                RoleName = "Quản trị viên",
                Description = "Toàn quyền hệ thống",
                IsSystem = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.Roles.Add(adminRole);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        var user = await _dbContext.Users.FirstOrDefaultAsync(x => x.Username == username || x.Email == email, cancellationToken);
        if (user is null)
        {
            user = new User
            {
                Username = username,
                Email = email,
                FullName = "TS. Nguyễn Minh Anh",
                Initials = "MA",
                AccountStatus = "active",
                IsSystemAdmin = true,
                EmailConfirmed = true,
                MustChangePassword = false,
                FailedLoginCount = 0,
                PasswordHash = _passwordService.Hash(password),
                PasswordChangedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        else
        {
            user.AccountStatus = "active";
            user.Email = email;
            user.FullName = "TS. Nguyễn Minh Anh";
            user.Initials = "MA";
            user.IsSystemAdmin = true;
            user.PasswordHash = _passwordService.Hash(password);
            user.PasswordChangedAt = DateTime.UtcNow;
            user.DeletedAt = null;
            user.DeletedBy = null;
            user.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        var existingUserRole = await _dbContext.UserRoles.FirstOrDefaultAsync(x => x.UserId == user.UserId && x.RoleId == adminRole.RoleId, cancellationToken);
        if (existingUserRole is null)
        {
            _dbContext.UserRoles.Add(new UserRole
            {
                UserId = user.UserId,
                RoleId = adminRole.RoleId,
                AssignedAt = DateTime.UtcNow,
                AssignedBy = user.UserId,
                IsActive = true
            });
        }
        else
        {
            existingUserRole.IsActive = true;
        }

        var permissionIds = await _dbContext.Permissions.Select(x => x.PermissionId).ToListAsync(cancellationToken);
        var existingPermissionIds = await _dbContext.RolePermissions
            .Where(x => x.RoleId == adminRole.RoleId)
            .Select(x => x.PermissionId)
            .ToListAsync(cancellationToken);

        foreach (var permissionId in permissionIds.Except(existingPermissionIds))
        {
            _dbContext.RolePermissions.Add(new RolePermission
            {
                RoleId = adminRole.RoleId,
                PermissionId = permissionId,
                IsAllowed = true,
                AssignedAt = DateTime.UtcNow,
                AssignedBy = user.UserId
            });
        }

        foreach (var permission in _dbContext.RolePermissions.Where(x => x.RoleId == adminRole.RoleId))
        {
            permission.IsAllowed = true;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureRequiredPermissionsAsync(CancellationToken cancellationToken)
    {
        var modules = new Dictionary<string, string>
        {
            ["dashboard"] = "Tổng quan tiến độ",
            ["research_project"] = "Đề tài nghiên cứu",
            ["project_phase"] = "Giai đoạn",
            ["project_milestone"] = "Mốc tiến độ",
            ["project_deadline"] = "Hạn chót",
            ["training_event"] = "Sự kiện đào tạo",
            ["notification"] = "Thông báo",
            ["setting"] = "Cài đặt",
            ["user"] = "Người dùng",
            ["role"] = "Vai trò",
            ["permission"] = "Quyền"
        };

        var actions = new Dictionary<string, string>
        {
            ["view"] = "Xem",
            ["create"] = "Thêm",
            ["update"] = "Sửa",
            ["delete"] = "Xóa",
            ["export"] = "Xuất dữ liệu",
            ["configure"] = "Cấu hình"
        };

        var required = new[]
        {
            "dashboard.view",
            "research_project.view", "research_project.create", "research_project.update", "research_project.delete", "research_project.export",
            "project_phase.view", "project_phase.create", "project_phase.update", "project_phase.delete",
            "project_milestone.view", "project_milestone.create", "project_milestone.update", "project_milestone.delete",
            "project_deadline.view", "project_deadline.create", "project_deadline.update", "project_deadline.delete",
            "training_event.view", "training_event.create", "training_event.update", "training_event.delete", "training_event.export",
            "notification.view", "notification.update", "notification.delete", "notification.configure",
            "setting.view", "setting.update", "setting.configure",
            "user.view", "user.create", "user.update", "user.delete",
            "role.view", "role.create", "role.update", "role.delete",
            "permission.view", "permission.update", "permission.configure"
        };

        var existing = await _dbContext.Permissions
            .Select(x => x.ModuleCode + "." + x.ActionCode)
            .ToListAsync(cancellationToken);

        foreach (var permissionCode in required.Except(existing))
        {
            var parts = permissionCode.Split('.');
            var moduleCode = parts[0];
            var actionCode = parts[1];
            var moduleName = modules.GetValueOrDefault(moduleCode, moduleCode);
            var actionName = actions.GetValueOrDefault(actionCode, actionCode);

            _dbContext.Permissions.Add(new Permission
            {
                ModuleCode = moduleCode,
                ModuleName = moduleName,
                ActionCode = actionCode,
                ActionName = actionName,
                Description = $"{moduleName} - {actionName}",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
