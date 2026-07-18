namespace Rms.Infrastructure.Options;

public sealed class JwtOptions
{
    public string Issuer { get; set; } = "RMS";
    public string Audience { get; set; } = "RMS.Admin";
    public string Key { get; set; } = string.Empty;
    public string SigningKey { get; set; } = "dev-only-change-this-signing-key-for-rms";
    public int ExpirationMinutes { get; set; } = 480;
    public string EffectiveSigningKey => string.IsNullOrWhiteSpace(Key) ? SigningKey : Key;
}
