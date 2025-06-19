using MetaLink.Domain.Entities;

namespace Metalink.Domain.Interfaces
{
    public interface IAvatarRepository
    {
        Task<IEnumerable<Avatar>> GetAllAsync();
        Task<Avatar> GetByIdAsync(int avatarId);
        Task AddAsync(Avatar avatar);
        Task UpdateAsync(Avatar avatar);
        Task DeleteAsync(int avatarId);
        Task SaveChangesAsync();
    }
}
