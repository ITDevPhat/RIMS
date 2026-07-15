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
        await EnsureRequiredPermissionsAsync(cancellationToken);
        var roles = await EnsureRolesAsync(cancellationToken);
        var departments = await EnsureDepartmentsAsync(cancellationToken);
        var users = await EnsureUsersAsync(roles, departments, cancellationToken);
        await EnsureAdminPermissionsAsync(roles["ADMIN"], users["admin"], cancellationToken);
        await EnsureUserPreferencesAsync(users.Values, cancellationToken);
        var sponsors = await EnsureSponsorsAsync(cancellationToken);
        var projects = await EnsureProjectsAsync(departments, users, sponsors, cancellationToken);
        await EnsureProjectMembersAsync(projects, users, cancellationToken);
        var phases = await EnsurePrimaryProjectPhasesAsync(projects["NC-2026-001"], users, cancellationToken);
        await EnsurePrimaryProjectMilestonesAsync(projects["NC-2026-001"], phases, users, cancellationToken);
        await EnsureProjectDeadlinesAsync(projects["NC-2026-001"], phases, users, cancellationToken);
        await EnsureNotificationsAsync(users["admin"], projects["NC-2026-001"], cancellationToken);
        await EnsureAuditLogsAsync(users["admin"], projects["NC-2026-001"], cancellationToken);
    }

    private async Task<Dictionary<string, Role>> EnsureRolesAsync(CancellationToken cancellationToken)
    {
        var definitions = new[]
        {
            ("ADMIN", "Quản trị viên", "Toàn quyền hệ thống", true),
            ("RESEARCH_OFFICE", "Phòng Quản lý NCKH", "Quản lý danh mục và tiến độ nghiên cứu", false),
            ("PI", "Chủ nhiệm đề tài", "Quản lý đề tài được phân công", false),
            ("RESEARCH_MEMBER", "Thành viên nghiên cứu", "Cập nhật phần việc và mốc tiến độ", false),
            ("VIEWER", "Người xem", "Chỉ xem dữ liệu được cấp quyền", false)
        };

        foreach (var (code, name, description, isSystem) in definitions)
        {
            var role = await _dbContext.Roles.FirstOrDefaultAsync(x => x.RoleCode == code, cancellationToken);
            if (role is null)
            {
                _dbContext.Roles.Add(new Role
                {
                    RoleCode = code,
                    RoleName = name,
                    Description = description,
                    IsSystem = isSystem,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
            }
            else
            {
                role.RoleName = name;
                role.Description = description;
                role.IsSystem = isSystem;
                role.IsActive = true;
                role.DeletedAt = null;
                role.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await _dbContext.Roles.Where(x => definitions.Select(d => d.Item1).Contains(x.RoleCode)).ToDictionaryAsync(x => x.RoleCode, cancellationToken);
    }

    private async Task<Dictionary<string, Department>> EnsureDepartmentsAsync(CancellationToken cancellationToken)
    {
        var definitions = new[]
        {
            ("QLNCKH", "Phòng Quản lý Nghiên cứu Khoa học", "administrative", 10),
            ("KHAMBENH", "Khoa Khám bệnh", "clinical", 20),
            ("NOITIET", "Khoa Nội tiết", "clinical", 30),
            ("NOIHOHAP", "Khoa Nội hô hấp", "clinical", 40),
            ("QLCL", "Phòng Quản lý chất lượng", "administrative", 50),
            ("CTXH", "Phòng Công tác xã hội", "administrative", 60),
            ("THONGKE", "Tổ Thống kê", "support", 70),
            ("HSBA", "Khoa Hồ sơ bệnh án", "support", 80)
        };

        foreach (var (code, name, type, sortOrder) in definitions)
        {
            var department = await _dbContext.Departments.FirstOrDefaultAsync(x => x.DepartmentCode == code, cancellationToken);
            if (department is null)
            {
                _dbContext.Departments.Add(new Department
                {
                    DepartmentCode = code,
                    DepartmentName = name,
                    DepartmentType = type,
                    Description = $"Đơn vị demo: {name}",
                    IsActive = true,
                    SortOrder = sortOrder,
                    CreatedAt = DateTime.UtcNow
                });
            }
            else
            {
                department.DepartmentName = name;
                department.DepartmentType = type;
                department.IsActive = true;
                department.SortOrder = sortOrder;
                department.DeletedAt = null;
                department.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await _dbContext.Departments.Where(x => definitions.Select(d => d.Item1).Contains(x.DepartmentCode)).ToDictionaryAsync(x => x.DepartmentCode, cancellationToken);
    }

    private async Task<Dictionary<string, User>> EnsureUsersAsync(Dictionary<string, Role> roles, Dictionary<string, Department> departments, CancellationToken cancellationToken)
    {
        var adminPassword = _configuration["DevelopmentAdmin:Password"] ?? "demo123";
        var definitions = new[]
        {
            ("admin", "admin@hospital.vn", "Quản trị viên Bệnh viện", "QTV", "Quản trị hệ thống", "QLNCKH", true, "ADMIN", adminPassword),
            ("nckh.office", "nckh.office@hospital.vn", "ThS. Trần Thị Thu Hà", "TH", "Chuyên viên phòng NCKH", "QLNCKH", false, "RESEARCH_OFFICE", "demo123"),
            ("bs.minhanh", "minhanh@hospital.vn", "TS. Nguyễn Minh Anh", "MA", "Bác sĩ Nội tiết", "NOITIET", false, "PI", "demo123"),
            ("bs.quanghuy", "quanghuy@hospital.vn", "BSCKII. Lê Quang Huy", "QH", "Bác sĩ Nội hô hấp", "NOIHOHAP", false, "PI", "demo123"),
            ("dd.lan", "lan.nguyen@hospital.vn", "CN. Nguyễn Thị Lan", "LN", "Điều dưỡng nghiên cứu", "KHAMBENH", false, "RESEARCH_MEMBER", "demo123"),
            ("tk.phuong", "phuong.thongke@hospital.vn", "CN. Phạm Thu Phương", "PP", "Chuyên viên thống kê", "THONGKE", false, "RESEARCH_MEMBER", "demo123"),
            ("viewer", "viewer@hospital.vn", "Người xem Ban Giám đốc", "VW", "Người xem", "QLCL", false, "VIEWER", "demo123")
        };

        foreach (var item in definitions)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(x => x.Username == item.Item1 || x.Email == item.Item2, cancellationToken);
            if (user is null)
            {
                user = new User
                {
                    Username = item.Item1,
                    Email = item.Item2,
                    FullName = item.Item3,
                    Initials = item.Item4,
                    Title = item.Item5,
                    DepartmentId = departments[item.Item6].DepartmentId,
                    AccountStatus = "active",
                    IsSystemAdmin = item.Item7,
                    EmailConfirmed = true,
                    MustChangePassword = false,
                    FailedLoginCount = 0,
                    PasswordHash = _passwordService.Hash(item.Item9),
                    PasswordChangedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };
                _dbContext.Users.Add(user);
                await _dbContext.SaveChangesAsync(cancellationToken);
            }
            else
            {
                user.Username = item.Item1;
                user.Email = item.Item2;
                user.FullName = item.Item3;
                user.Initials = item.Item4;
                user.Title = item.Item5;
                user.DepartmentId = departments[item.Item6].DepartmentId;
                user.AccountStatus = "active";
                user.IsSystemAdmin = item.Item7;
                user.EmailConfirmed = true;
                user.MustChangePassword = false;
                user.FailedLoginCount = 0;
                user.DeletedAt = null;
                user.DeletedBy = null;
                user.UpdatedAt = DateTime.UtcNow;
                if (item.Item1 == "admin")
                {
                    user.PasswordHash = _passwordService.Hash(item.Item9);
                    user.PasswordChangedAt = DateTime.UtcNow;
                }
            }

            await EnsureUserRoleAsync(user, roles[item.Item8], cancellationToken);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await _dbContext.Users.Where(x => definitions.Select(d => d.Item1).Contains(x.Username)).ToDictionaryAsync(x => x.Username, cancellationToken);
    }

    private async Task EnsureUserRoleAsync(User user, Role role, CancellationToken cancellationToken)
    {
        var existing = await _dbContext.UserRoles.FirstOrDefaultAsync(x => x.UserId == user.UserId && x.RoleId == role.RoleId, cancellationToken);
        if (existing is null)
        {
            _dbContext.UserRoles.Add(new UserRole
            {
                UserId = user.UserId,
                RoleId = role.RoleId,
                AssignedAt = DateTime.UtcNow,
                AssignedBy = user.UserId,
                IsActive = true
            });
        }
        else
        {
            existing.IsActive = true;
        }
    }

    private async Task EnsureAdminPermissionsAsync(Role adminRole, User adminUser, CancellationToken cancellationToken)
    {
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
                AssignedBy = adminUser.UserId
            });
        }

        foreach (var permission in _dbContext.RolePermissions.Where(x => x.RoleId == adminRole.RoleId))
        {
            permission.IsAllowed = true;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureUserPreferencesAsync(IEnumerable<User> users, CancellationToken cancellationToken)
    {
        foreach (var user in users)
        {
            if (await _dbContext.UserPreferences.AnyAsync(x => x.UserId == user.UserId, cancellationToken))
            {
                continue;
            }

            _dbContext.UserPreferences.Add(new UserPreference
            {
                UserId = user.UserId,
                AppearanceMode = "system",
                LanguageCode = "vi-VN",
                EnableInAppNotification = true,
                EnableEmailNotification = false,
                ReceiveDeadlineNotification = true,
                ReceiveTrainingNotification = true,
                ReceiveEthicsNotification = true,
                AutoMarkReadOnOpen = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<Dictionary<string, Sponsor>> EnsureSponsorsAsync(CancellationToken cancellationToken)
    {
        var definitions = new[]
        {
            ("BV-DEMO", "Bệnh viện Đa khoa Demo", "internal"),
            ("SO-YTE", "Sở Y tế Thành phố", "government")
        };

        foreach (var (code, name, type) in definitions)
        {
            var sponsor = await _dbContext.Sponsors.FirstOrDefaultAsync(x => x.SponsorCode == code, cancellationToken);
            if (sponsor is null)
            {
                _dbContext.Sponsors.Add(new Sponsor { SponsorCode = code, SponsorName = name, SponsorType = type, IsActive = true, CreatedAt = DateTime.UtcNow });
            }
            else
            {
                sponsor.SponsorName = name;
                sponsor.SponsorType = type;
                sponsor.IsActive = true;
                sponsor.DeletedAt = null;
                sponsor.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await _dbContext.Sponsors.Where(x => definitions.Select(d => d.Item1).Contains(x.SponsorCode)).ToDictionaryAsync(x => x.SponsorCode, cancellationToken);
    }

    private async Task<Dictionary<string, ResearchProject>> EnsureProjectsAsync(Dictionary<string, Department> departments, Dictionary<string, User> users, Dictionary<string, Sponsor> sponsors, CancellationToken cancellationToken)
    {
        var definitions = new[]
        {
            ("NC-2026-001", "Nghiên cứu tỷ lệ kiểm soát huyết áp ở người bệnh tăng huyết áp điều trị ngoại trú", "NOITIET", "bs.minhanh", "BV-DEMO", "clinical_observational", "BV-THA-2026-01", "1.2", "approved", new DateOnly(2026, 1, 5), new DateOnly(2026, 12, 31), new DateOnly(2026, 1, 15), new DateOnly(2026, 10, 30), "Thu thập số liệu", 58m, "in_progress", "at_risk", "Người bệnh tái khám không đúng hẹn; dữ liệu nhập chưa thống nhất."),
            ("NC-2026-002", "Đánh giá tuân thủ điều trị ở người bệnh đái tháo đường type 2", "NOITIET", "bs.minhanh", "BV-DEMO", "clinical_observational", "BV-DTD-2026-02", "1.0", "approved", new DateOnly(2026, 2, 1), new DateOnly(2026, 11, 30), new DateOnly(2026, 2, 15), new DateOnly(2026, 9, 30), "Phân tích sơ bộ", 42m, "in_progress", "medium", "Thiếu thông tin trong hồ sơ bệnh án."),
            ("NC-2026-003", "Khảo sát chất lượng giấc ngủ ở nhân viên y tế trực đêm", "QLCL", "nckh.office", "BV-DEMO", "cross_sectional", "BV-GN-2026-03", "1.0", "not_required", (DateOnly?)null, (DateOnly?)null, new DateOnly(2026, 3, 1), new DateOnly(2026, 8, 31), "Hoàn thiện báo cáo", 75m, "in_progress", "low", "Chờ phản hồi góp ý từ các khoa."),
            ("NC-2026-004", "Mô tả đặc điểm người bệnh COPD tái nhập viện trong 30 ngày", "NOIHOHAP", "bs.quanghuy", "SO-YTE", "retrospective", "BV-COPD-2026-04", "0.9", "pending", (DateOnly?)null, (DateOnly?)null, new DateOnly(2026, 4, 1), new DateOnly(2026, 12, 15), "Chuẩn bị hồ sơ hội đồng đạo đức", 25m, "in_progress", "high", "Chờ xác nhận của hội đồng đạo đức."),
            ("NC-2026-005", "Đánh giá thời gian chờ khám tại Khoa Khám bệnh", "KHAMBENH", "nckh.office", "BV-DEMO", "quality_improvement", "BV-TGCK-2026-05", "1.0", "not_required", (DateOnly?)null, (DateOnly?)null, new DateOnly(2026, 5, 1), new DateOnly(2026, 7, 31), "Kết thúc", 100m, "completed", "low", "Đã hoàn thành đúng hạn.")
        };

        foreach (var item in definitions)
        {
            var project = await _dbContext.ResearchProjects.FirstOrDefaultAsync(x => x.ProjectCode == item.Item1, cancellationToken);
            if (project is null)
            {
                project = new ResearchProject { ProjectCode = item.Item1, CreatedAt = DateTime.UtcNow };
                _dbContext.ResearchProjects.Add(project);
            }

            project.ProjectTitle = item.Item2;
            project.LeadDepartmentId = departments[item.Item3].DepartmentId;
            project.PrincipalInvestigatorId = users[item.Item4].UserId;
            project.SponsorId = sponsors[item.Item5].SponsorId;
            project.ResearchType = item.Item6;
            project.ProtocolNumber = item.Item7;
            project.ProtocolVersion = item.Item8;
            project.EthicsStatus = item.Item9;
            project.EthicsApprovalDate = item.Item10;
            project.EthicsExpiryDate = item.Item11;
            project.PlannedStartDate = item.Item12;
            project.PlannedEndDate = item.Item13;
            project.CurrentPhaseName = item.Item14;
            project.ProgressPercent = item.Item15;
            project.ProjectStatus = item.Item16;
            project.HealthStatus = item.Item17 == "at_risk" || item.Item17 == "high" ? "needs_attention" : "on_track";
            project.RiskLevel = item.Item17;
            project.PriorityLevel = item.Item17 == "high" ? "high" : "normal";
            project.Notes = item.Item18;
            project.IsActive = true;
            project.DeletedAt = null;
            project.UpdatedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await _dbContext.ResearchProjects.Where(x => definitions.Select(d => d.Item1).Contains(x.ProjectCode)).ToDictionaryAsync(x => x.ProjectCode, cancellationToken);
    }

    private async Task EnsureProjectMembersAsync(Dictionary<string, ResearchProject> projects, Dictionary<string, User> users, CancellationToken cancellationToken)
    {
        var members = new[]
        {
            ("NC-2026-001", "bs.minhanh", "Chủ nhiệm đề tài", "Điều phối chung"),
            ("NC-2026-001", "dd.lan", "Thành viên", "Thu thập số liệu tại phòng khám"),
            ("NC-2026-001", "tk.phuong", "Thống kê", "Làm sạch và phân tích số liệu"),
            ("NC-2026-004", "bs.quanghuy", "Chủ nhiệm đề tài", "Phụ trách chuyên môn hô hấp")
        };

        foreach (var item in members)
        {
            var projectId = projects[item.Item1].ProjectId;
            var userId = users[item.Item2].UserId;
            var member = await _dbContext.ProjectMembers.FirstOrDefaultAsync(x => x.ProjectId == projectId && x.UserId == userId, cancellationToken);
            if (member is null)
            {
                _dbContext.ProjectMembers.Add(new ProjectMember
                {
                    ProjectId = projectId,
                    UserId = userId,
                    MemberRole = item.Item3,
                    Responsibility = item.Item4,
                    JoinedAt = new DateOnly(2026, 1, 15),
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
            }
            else
            {
                member.MemberRole = item.Item3;
                member.Responsibility = item.Item4;
                member.IsActive = true;
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<Dictionary<int, ProjectPhase>> EnsurePrimaryProjectPhasesAsync(ResearchProject project, Dictionary<string, User> users, CancellationToken cancellationToken)
    {
        var definitions = new[]
        {
            (1, "Viết đề cương", new DateOnly(2026, 1, 15), new DateOnly(2026, 2, 10), new DateOnly(2026, 2, 12), new DateOnly(2026, 1, 15), new DateOnly(2026, 2, 9), 100m, "completed", "bs.minhanh", "Hoàn thành đúng hạn."),
            (2, "Nộp đề cương", new DateOnly(2026, 2, 11), new DateOnly(2026, 2, 20), new DateOnly(2026, 2, 20), new DateOnly(2026, 2, 11), new DateOnly(2026, 2, 22), 100m, "completed", "nckh.office", "Hoàn thành trễ do thiếu chữ ký xác nhận của khoa."),
            (3, "Báo cáo đợi duyệt", new DateOnly(2026, 2, 23), new DateOnly(2026, 3, 15), new DateOnly(2026, 3, 15), new DateOnly(2026, 2, 23), new DateOnly(2026, 3, 14), 100m, "completed", "bs.minhanh", "Đã trình bày trước hội đồng."),
            (4, "Chỉnh sửa đề cương", new DateOnly(2026, 3, 16), new DateOnly(2026, 3, 31), new DateOnly(2026, 4, 3), new DateOnly(2026, 3, 16), new DateOnly(2026, 4, 5), 100m, "completed", "bs.minhanh", "Hoàn thành trễ do chờ xác nhận của hội đồng đạo đức."),
            (5, "Duyệt đề cương", new DateOnly(2026, 4, 6), new DateOnly(2026, 4, 20), new DateOnly(2026, 4, 20), new DateOnly(2026, 4, 6), new DateOnly(2026, 4, 18), 100m, "completed", "nckh.office", "Đã duyệt và lưu hồ sơ."),
            (6, "Thu thập số liệu", new DateOnly(2026, 4, 21), new DateOnly(2026, 7, 31), new DateOnly(2026, 7, 31), new DateOnly(2026, 4, 21), (DateOnly?)null, 62m, "in_progress", "dd.lan", "Người bệnh tái khám không đúng hẹn; thiếu thông tin trong hồ sơ bệnh án."),
            (7, "Xử lý thống kê / làm sạch số liệu", new DateOnly(2026, 8, 1), new DateOnly(2026, 9, 15), new DateOnly(2026, 9, 10), (DateOnly?)null, (DateOnly?)null, 15m, "at_risk", "tk.phuong", "Dữ liệu nhập chưa thống nhất, cần khóa biểu mẫu nhập liệu."),
            (8, "Báo cáo kết quả nghiên cứu", new DateOnly(2026, 9, 16), new DateOnly(2026, 10, 30), new DateOnly(2026, 10, 30), (DateOnly?)null, (DateOnly?)null, 0m, "not_started", "bs.minhanh", "Chưa bắt đầu.")
        };

        foreach (var item in definitions)
        {
            var phase = await _dbContext.ProjectPhases.FirstOrDefaultAsync(x => x.ProjectId == project.ProjectId && x.SortOrder == item.Item1, cancellationToken);
            if (phase is null)
            {
                phase = new ProjectPhase { ProjectId = project.ProjectId, SortOrder = item.Item1, CreatedAt = DateTime.UtcNow };
                _dbContext.ProjectPhases.Add(phase);
            }

            phase.PhaseName = item.Item2;
            phase.PlannedStartDate = item.Item3;
            phase.PlannedEndDate = item.Item4;
            phase.DeadlineDate = item.Item5;
            phase.ActualStartDate = item.Item6;
            phase.ActualEndDate = item.Item7;
            phase.ProgressPercent = item.Item8;
            phase.PhaseStatus = item.Item9;
            phase.OwnerUserId = users[item.Item10].UserId;
            phase.Notes = item.Item11;
            phase.IsActive = true;
            phase.DeletedAt = null;
            phase.UpdatedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await _dbContext.ProjectPhases.Where(x => x.ProjectId == project.ProjectId).ToDictionaryAsync(x => x.SortOrder, cancellationToken);
    }

    private async Task EnsurePrimaryProjectMilestonesAsync(ResearchProject project, Dictionary<int, ProjectPhase> phases, Dictionary<string, User> users, CancellationToken cancellationToken)
    {
        var names = new[]
        {
            (1, new[] { "Xác định câu hỏi nghiên cứu", "Tổng quan tài liệu", "Xây dựng mục tiêu nghiên cứu", "Tính cỡ mẫu" }),
            (2, new[] { "Hoàn thiện đề cương", "Chuẩn bị hồ sơ hội đồng đạo đức", "Xin chữ ký xác nhận của khoa" }),
            (3, new[] { "Báo cáo trước hội đồng", "Ghi nhận góp ý", "Tổng hợp biên bản họp" }),
            (4, new[] { "Chỉnh sửa phương pháp", "Cập nhật bộ câu hỏi", "Nộp lại bản chỉnh sửa" }),
            (5, new[] { "Nhận quyết định duyệt", "Lưu hồ sơ phê duyệt", "Thông báo nhóm nghiên cứu" }),
            (6, new[] { "Kiểm tra hồ sơ bệnh án", "Liên hệ người bệnh tái khám", "Nhập dữ liệu", "Kiểm tra thiếu dữ liệu", "Đối chiếu dữ liệu nguồn" }),
            (7, new[] { "Làm sạch dữ liệu", "Chốt tập dữ liệu", "Phân tích thống kê", "Kiểm tra bảng biểu" }),
            (8, new[] { "Viết báo cáo kết quả", "Hoàn thiện báo cáo", "Nộp báo cáo nghiệm thu", "Chuẩn bị bản thảo bài báo" })
        };

        foreach (var group in names)
        {
            for (var i = 0; i < group.Item2.Length; i++)
            {
                var code = $"NC-2026-001-P{group.Item1:00}-M{i + 1:00}";
                var milestone = await _dbContext.ProjectMilestones.FirstOrDefaultAsync(x => x.MilestoneCode == code, cancellationToken);
                if (milestone is null)
                {
                    milestone = new ProjectMilestone { MilestoneCode = code, ProjectId = project.ProjectId, CreatedAt = DateTime.UtcNow };
                    _dbContext.ProjectMilestones.Add(milestone);
                }

                var phase = phases[group.Item1];
                milestone.PhaseId = phase.PhaseId;
                milestone.MilestoneName = group.Item2[i];
                milestone.MilestoneDescription = $"Mốc {i + 1} của giai đoạn {phase.PhaseName}";
                milestone.DueDate = phase.PlannedStartDate?.AddDays(3 + (i * 5)) ?? new DateOnly(2026, 10, 1).AddDays(i * 7);
                milestone.CompletedDate = phase.PhaseStatus == "completed" ? milestone.DueDate.AddDays(i % 2 == 0 ? 0 : 2) : null;
                milestone.OwnerUserId = phase.OwnerUserId ?? users["bs.minhanh"].UserId;
                milestone.MilestoneStatus = phase.PhaseStatus == "completed" ? "completed" : group.Item1 == 6 && i < 3 ? "in_progress" : group.Item1 == 7 && i == 0 ? "at_risk" : "not_started";
                milestone.PriorityLevel = milestone.MilestoneStatus == "at_risk" ? "high" : "medium";
                milestone.Notes = milestone.MilestoneStatus == "at_risk" ? "Dữ liệu nhập chưa thống nhất." : phase.Notes;
                milestone.IsActive = true;
                milestone.DeletedAt = null;
                milestone.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureProjectDeadlinesAsync(ResearchProject project, Dictionary<int, ProjectPhase> phases, Dictionary<string, User> users, CancellationToken cancellationToken)
    {
        var items = new[]
        {
            ("DL-NC-2026-001-01", phases[6].PhaseId, "Bổ sung hồ sơ bệnh án còn thiếu", new DateOnly(2026, 7, 25), "high", "open", users["dd.lan"].UserId),
            ("DL-NC-2026-001-02", phases[7].PhaseId, "Chốt tập dữ liệu phân tích", new DateOnly(2026, 9, 10), "urgent", "open", users["tk.phuong"].UserId),
            ("DL-NC-2026-001-03", phases[8].PhaseId, "Nộp báo cáo kết quả nghiên cứu", new DateOnly(2026, 10, 30), "medium", "open", users["bs.minhanh"].UserId)
        };

        foreach (var item in items)
        {
            var deadline = await _dbContext.ProjectDeadlines.FirstOrDefaultAsync(x => x.DeadlineDescription == item.Item1, cancellationToken);
            if (deadline is null)
            {
                deadline = new ProjectDeadline { DeadlineDescription = item.Item1, CreatedAt = DateTime.UtcNow };
                _dbContext.ProjectDeadlines.Add(deadline);
            }

            deadline.ProjectId = project.ProjectId;
            deadline.PhaseId = item.PhaseId;
            deadline.DeadlineType = "project_phase";
            deadline.DeadlineTitle = item.Item3;
            deadline.DueDate = item.Item4;
            deadline.PriorityLevel = item.Item5;
            deadline.DeadlineStatus = item.Item6;
            deadline.ResponsibleUserId = item.Item7;
            deadline.DeletedAt = null;
            deadline.UpdatedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureNotificationsAsync(User admin, ResearchProject project, CancellationToken cancellationToken)
    {
        var notification = await _dbContext.Notifications.FirstOrDefaultAsync(x => x.NotificationType == "demo_project_at_risk" && x.RelatedEntityId == project.ProjectId, cancellationToken);
        if (notification is null)
        {
            notification = new Notification
            {
                NotificationType = "demo_project_at_risk",
                Category = "research",
                Title = "Đề tài NC-2026-001 có hạng mục cần theo dõi",
                Message = "Giai đoạn xử lý thống kê có nguy cơ trễ do dữ liệu nhập chưa thống nhất.",
                PriorityLevel = "high",
                RelatedEntityType = "research_project",
                RelatedEntityId = project.ProjectId,
                RelatedEntityCode = project.ProjectCode,
                ActionUrl = $"/research/projects/{project.ProjectId}",
                SuggestedAction = "Kiểm tra tiến độ",
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            };
            _dbContext.Notifications.Add(notification);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        if (!await _dbContext.NotificationRecipients.AnyAsync(x => x.NotificationId == notification.NotificationId && x.UserId == admin.UserId, cancellationToken))
        {
            _dbContext.NotificationRecipients.Add(new NotificationRecipient
            {
                NotificationId = notification.NotificationId,
                UserId = admin.UserId,
                IsRead = false,
                IsDismissed = false,
                DeliveredInAppAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            });
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    private async Task EnsureAuditLogsAsync(User admin, ResearchProject project, CancellationToken cancellationToken)
    {
        if (await _dbContext.ActivityLogs.AnyAsync(x => x.ModuleCode == "seed" && x.EntityCode == project.ProjectCode, cancellationToken))
        {
            return;
        }

        _dbContext.ActivityLogs.Add(new ActivityLog
        {
            OccurredAt = DateTime.UtcNow,
            UserId = admin.UserId,
            ModuleCode = "seed",
            ActionType = "initialize",
            EntityType = "ResearchProject",
            EntityId = project.ProjectId,
            EntityCode = project.ProjectCode,
            ActionSummary = "Seeded Neon PostgreSQL demo data",
            Status = "success"
        });
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
