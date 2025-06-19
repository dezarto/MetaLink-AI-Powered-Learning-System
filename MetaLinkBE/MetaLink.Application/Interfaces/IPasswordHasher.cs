namespace Metalink.Application.Interfaces
{
    public interface IPasswordHasher
    {
        string HashPassword(string password);
        bool VerifyPassword(string plainPassword, string hashedPassword);
    }
}
