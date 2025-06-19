namespace Metalink.Domain.Entities
{
    public class RefreshToken
    {
        public string Token { get; set; }
        public DateTime Expiration { get; set; }
        public DateTime Created { get; set; }
        public DateTime? Revoked { get; set; }
        public bool IsExpired => DateTime.UtcNow >= Expiration;
        public bool IsActive => Revoked == null && !IsExpired;
    }
}
