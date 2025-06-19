using Metalink.Domain.Entities;

namespace Metalink.Domain.Interfaces
{
    public interface IUserService
    {
        Task<User> GetByIdAsync(int id);
        Task<IEnumerable<User>> GetAllAsync();
        Task<User> CreateAsync(User user);
        Task UpdateAsync(User user);
        Task DeleteAsync(int id);
        Task<User?> GetByResetTokenAsync(string resetToken);
    }
}
