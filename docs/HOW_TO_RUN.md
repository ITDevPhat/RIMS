# Cách Chạy Dự Án

## Yêu Cầu Trước Khi Chạy

- Node.js
- pnpm hoặc npm
- .NET SDK 8+
- PostgreSQL connection string trên Neon
- Tùy chọn: `dotnet-ef` 8.x

## Thiết Lập Cơ Sở Dữ Liệu

Backend hiện dùng PostgreSQL qua Neon. Không ghi connection string thật vào `appsettings.json`.

Thiết lập local bằng .NET User Secrets:

```powershell
dotnet user-secrets init --project src/Rms.Api
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=<NEON_HOST>;Port=5432;Database=<DATABASE>;Username=<USER>;Password=<PASSWORD>;SSL Mode=Require;Trust Server Certificate=true" --project src/Rms.Api
```

Kiểm tra secret đã có, không in password ra màn hình:

```powershell
dotnet user-secrets list --project src/Rms.Api
```

Khi deploy hoặc chạy CI, dùng environment variable thay vì User Secrets:

```powershell
$env:ConnectionStrings__DefaultConnection = "Host=<NEON_HOST>;Port=5432;Database=<DATABASE>;Username=<USER>;Password=<PASSWORD>;SSL Mode=Require;Trust Server Certificate=true"
```

SQL Server DDL/seed cũ vẫn được giữ để backup ở `database/sqlserver/db.sql`.

## Chạy Backend

```powershell
dotnet restore Rms.Backend.sln
dotnet build Rms.Backend.sln
dotnet run --project src/Rms.Api/Rms.Api.csproj --launch-profile http
```

URLs:

- API base HTTPS: `https://localhost:7005`
- API base HTTP: `http://localhost:5000`
- Swagger: `https://localhost:7005/swagger/index.html`
- Health: `https://localhost:7005/api/health`
- DB health: `https://localhost:7005/api/health/database`

Profile `http` vẫn mở cả HTTPS và HTTP để tiện chạy lệnh quen thuộc. Nếu chỉ muốn dùng profile HTTPS:

```powershell
dotnet run --project src/Rms.Api/Rms.Api.csproj --launch-profile https
```

Nếu máy chưa trust HTTPS dev certificate:

```powershell
dotnet dev-certs https --trust
dotnet dev-certs https --check --trust
```

## EF Core / Neon

Liệt kê migration:

```powershell
dotnet ef migrations list --project src/Rms.Infrastructure/Rms.Infrastructure.csproj --startup-project src/Rms.Api/Rms.Api.csproj
```

Cập nhật Neon database:

```powershell
dotnet ef database update --project src/Rms.Infrastructure/Rms.Infrastructure.csproj --startup-project src/Rms.Api/Rms.Api.csproj
```

## Chạy Frontend

```powershell
cd RIMS
npm install --no-package-lock
npm run build
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Nếu dùng `pnpm`:

```powershell
cd RIMS
pnpm install
pnpm build
pnpm dev -- --hostname 127.0.0.1 --port 3000
```

Frontend URL:

```text
http://localhost:3000
```

## Biến Môi Trường Frontend

Frontend hiện gọi API thật qua biến `NEXT_PUBLIC_API_BASE_URL`. Tạo hoặc kiểm tra file `RIMS/.env.local`:

```text
NEXT_PUBLIC_API_BASE_URL=https://localhost:7005/api
```

Sau khi tạo hoặc sửa `.env.local`, phải stop và chạy lại `npm run dev` hoặc `pnpm dev`. Next.js chỉ đọc biến `NEXT_PUBLIC_*` khi dev server khởi động.

## Tài Khoản Dev Mặc Định

Development admin được seed/cập nhật khi backend khởi động:

```text
Email/username: admin@hospital.vn
Username: admin
Password: demo123
```

Seeder nằm ở `src/Rms.Infrastructure/Services/DevelopmentAdminSeeder.cs`, cấu hình mặc định nằm trong `src/Rms.Api/appsettings.json` mục `DevelopmentAdmin`.

Test nhanh bằng PowerShell:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "https://localhost:7005/api/auth/login" `
  -ContentType "application/json" `
  -Body '{"usernameOrEmail":"admin@hospital.vn","password":"demo123"}'
```

Nếu trả về `success: true` và có `data.token`, backend và tài khoản admin đang đúng.

## Xử Lý Lỗi Thường Gặp

| Vấn đề | Cách xử lý |
|---|---|
| NuGet source lỗi | Dùng `NuGet.config` local của repo |
| DLL bị lock khi build | Stop process `Rms.Api`, build lại |
| `Không tìm thấy ConnectionStrings:DefaultConnection` | Set User Secret hoặc env var `ConnectionStrings__DefaultConnection` |
| DB connection failed | Kiểm tra Neon connection string, SSL mode, network, và User Secrets/env var |
| Swagger unauthorized | Login lấy JWT rồi Authorize trong Swagger |
| 403 Forbidden | User thiếu permission |
| CORS | Kiểm tra `Cors:AllowedOrigins` có `http://localhost:3000` |
| Frontend báo sai email/mật khẩu nhưng Swagger login 200 | Kiểm tra `RIMS/.env.local` có `NEXT_PUBLIC_API_BASE_URL=https://localhost:7005/api`, stop/start lại frontend, hard refresh browser, rồi thử lại |
| Frontend không gọi API | Mở DevTools > Network, kiểm tra request `POST https://localhost:7005/api/auth/login`; nếu không thấy request này thì frontend đang chạy sai env hoặc chưa restart |
| Login bị CORS | Backend phải chạy và `Cors:AllowedOrigins` phải có đúng origin frontend, ví dụ `http://localhost:3000` |
| `Failed to bind ... address already in use` | Port 7005/5000 đang có API cũ chạy. Dùng lệnh bên dưới để tìm và stop process. |

Kiểm tra process đang chiếm backend port:

```powershell
Get-NetTCPConnection -LocalPort 7005,5000 -ErrorAction SilentlyContinue |
  Select-Object LocalAddress,LocalPort,State,OwningProcess
```

Dừng process theo PID:

```powershell
Stop-Process -Id <PID> -Force
```

Hoặc nếu đúng là API cũ:

```powershell
Get-Process Rms.Api -ErrorAction SilentlyContinue | Stop-Process -Force
```
