# Cách Chạy Dự Án

## Prerequisites

- Node.js
- npm
- .NET SDK 8+
- SQL Server 2019+
- Optional: `dotnet-ef` 8.x

## Database Setup

1. Mở SQL Server.
2. Chạy `db.sql`.
3. Xác nhận database `RMS` tồn tại.
4. Cấu hình connection string local bằng placeholder:

```json
{
  "ConnectionStrings": {
    "RmsDatabase": "Server=<SQL_SERVER>;Database=RMS;User Id=<SQL_USER>;Password=<SQL_PASSWORD>;Encrypt=True;TrustServerCertificate=True"
  }
}
```

Không commit credential thật.

## Backend Setup

```powershell
dotnet restore Rms.Backend.sln
dotnet build Rms.Backend.sln
dotnet run --project src/Rms.Api/Rms.Api.csproj --launch-profile http
```

URLs:

- API base: `http://localhost:5000`
- Swagger: `http://localhost:5000/swagger/index.html`
- Health: `http://localhost:5000/api/health`
- DB health: `http://localhost:5000/api/health/db`

## Frontend Setup

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

## Frontend API Env

Frontend hiện gọi API thật qua biến `NEXT_PUBLIC_API_BASE_URL`. Tạo hoặc kiểm tra file `RIMS/.env.local`:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

Sau khi tạo hoặc sửa `.env.local`, phải stop và chạy lại `npm run dev` hoặc `pnpm dev`. Next.js chỉ đọc biến `NEXT_PUBLIC_*` khi dev server khởi động.

## Default Dev Login

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
  -Uri "http://localhost:5000/api/auth/login" `
  -ContentType "application/json" `
  -Body '{"usernameOrEmail":"admin@hospital.vn","password":"demo123"}'
```

Nếu trả về `success: true` và có `data.token`, backend và tài khoản admin đang đúng.

## Troubleshooting

| Vấn đề | Cách xử lý |
|---|---|
| NuGet source lỗi | Dùng `NuGet.config` local của repo |
| DLL bị lock khi build | Stop process `Rms.Api`, build lại |
| DB connection failed | Kiểm tra SQL Server, database `RMS`, connection string local |
| Swagger unauthorized | Login lấy JWT rồi Authorize trong Swagger |
| 403 Forbidden | User thiếu permission |
| CORS | Kiểm tra `Cors:AllowedOrigins` có `http://localhost:3000` |
| Frontend báo sai email/mật khẩu nhưng Swagger login 200 | Kiểm tra `RIMS/.env.local` có `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api`, stop/start lại frontend, hard refresh browser, rồi thử lại |
| Frontend không gọi API | Mở DevTools > Network, kiểm tra request `POST http://localhost:5000/api/auth/login`; nếu không thấy request này thì frontend đang chạy sai env hoặc chưa restart |
| Login bị CORS | Backend phải chạy `http://localhost:5000` và `Cors:AllowedOrigins` phải có đúng origin frontend, ví dụ `http://localhost:3000` |
| Port conflict | Đổi port backend/frontend hoặc stop process đang chiếm port |
