using Metalink.Domain.Entities;

namespace Metalink.Application.Interfaces
{
    public interface ITokenService
    {
        string GenerateToken(User user);
    }
}
