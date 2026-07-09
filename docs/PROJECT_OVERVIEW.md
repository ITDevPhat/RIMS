# Tổng Quan Dự Án RMS

## Tên dự án

RMS - Research Management System cho dashboard quản trị bệnh viện.

## Mục tiêu

Hệ thống hỗ trợ quản lý tiến độ đề tài nghiên cứu, giai đoạn, mốc tiến độ, hạn chót, đào tạo, thông báo, người dùng, vai trò, quyền hạn và nhật ký hoạt động.

## Người dùng mục tiêu

- Phòng Quản lý Nghiên cứu Khoa học
- Phòng Đào tạo
- Chủ nhiệm đề tài
- Thành viên nhóm nghiên cứu
- Quản trị viên hệ thống

## Module chính

- Đăng nhập, hồ sơ, cài đặt tài khoản
- Tổng quan tiến độ
- Đề tài nghiên cứu
- Giai đoạn, mốc tiến độ, hạn chót
- Mảng đào tạo và lịch đào tạo
- Trung tâm thông báo
- Cài đặt hệ thống
- Người dùng, vai trò, quyền hạn
- Audit/log hoạt động

## Tech stack

| Lớp | Công nghệ |
|---|---|
| Frontend | Next.js, React, Tailwind CSS, shadcn-style components, Base UI |
| Backend | ASP.NET Core 8 Web API |
| Database | SQL Server, EF Core database-first |
| Auth | JWT, BCrypt, role + permission authorization |
| API Docs | Swagger/OpenAPI |
| Logging | Serilog |

## Trạng thái hiện tại

| Khu vực | Trạng thái |
|---|---|
| Frontend UI | Build pass, TypeScript pass, đang dùng mock data/mock auth |
| Backend Phase 1-3 | Foundation, Auth, Admin đã QA pass |
| Backend Phase 4 | Research API đã QA pass |
| Database | RMS kết nối được, schema chính tồn tại |
| Integration | Chưa tích hợp frontend API thật |

## UI-only hiện tại

Frontend vẫn dùng các file mock:

- `RIMS/lib/mock-data.ts`
- `RIMS/lib/mock-dao-tao.ts`
- `RIMS/lib/mock-notifications.ts`
- `RIMS/lib/mock-admin-data.ts`
- `RIMS/lib/auth-context.tsx`

## Backend-integrated hiện tại

Backend đã có API thật cho:

- Auth/login/logout/me/change-password
- Users, roles, permissions
- Settings, account preferences
- Research projects, phases, milestones, deadlines
- Sponsors, project members, project documents

## Giới hạn đã biết

- Frontend chưa gọi backend API.
- Training/notification/dashboard/audit public APIs chưa hoàn thiện đầy đủ.
- Audit hiện được xác minh bằng SQL trực tiếp, chưa có controller public.
- `ref.system_settings` có thể trống nếu chưa seed dữ liệu.
