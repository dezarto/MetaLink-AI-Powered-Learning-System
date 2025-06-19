using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface IAvatarService
    {
        Task<IEnumerable<Avatar>> GetAllAvatarAsync();
        Task<Avatar> GetAvatarByIdAsync(int avatarId);
        Task AddAvatarAsync(Avatar avatar);
        Task UpdateAvatarAsync(Avatar avatar);
        Task DeleteAvatarAsync(int avatarId);
    }
}
