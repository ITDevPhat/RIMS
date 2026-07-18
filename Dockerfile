# ==============================
# Build stage
# ==============================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY ["NuGet.config", "./"]
COPY ["Rms.Backend.sln", "./"]
COPY ["src/Rms.Api/Rms.Api.csproj", "src/Rms.Api/"]
COPY ["src/Rms.Application/Rms.Application.csproj", "src/Rms.Application/"]
COPY ["src/Rms.Domain/Rms.Domain.csproj", "src/Rms.Domain/"]
COPY ["src/Rms.Infrastructure/Rms.Infrastructure.csproj", "src/Rms.Infrastructure/"]

RUN dotnet restore "src/Rms.Api/Rms.Api.csproj"

COPY . .

RUN dotnet publish "src/Rms.Api/Rms.Api.csproj" \
    --configuration Release \
    --output /app/publish \
    --no-restore \
    /p:UseAppHost=false

# ==============================
# Runtime stage
# ==============================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
ENV DOTNET_EnableDiagnostics=0

EXPOSE 8080

COPY --from=build /app/publish .

USER $APP_UID

ENTRYPOINT ["dotnet", "Rms.Api.dll"]
