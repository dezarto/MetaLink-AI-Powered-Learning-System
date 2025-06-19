using Metalink.Domain.Interfaces;
using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class AvatarService : IAvatarService
    {
        private readonly IAvatarRepository _avatarRepository;

        public AvatarService(IAvatarRepository avatarRepository)
        {
            _avatarRepository = avatarRepository;
        }

        public async Task AddAvatarAsync(Avatar avatar)
        {
            await _avatarRepository.AddAsync(avatar);
        }

        public async Task DeleteAvatarAsync(int avatarId)
        {
            await _avatarRepository.DeleteAsync(avatarId);
        }

        public async Task<IEnumerable<Avatar>> GetAllAvatarAsync()
        {
            return await _avatarRepository.GetAllAsync();
        }

        public async Task<Avatar> GetAvatarByIdAsync(int avatarId)
        {
            return await _avatarRepository.GetByIdAsync(avatarId);
        }

        public async Task UpdateAvatarAsync(Avatar avatar)
        {
            await _avatarRepository.UpdateAsync(avatar);
        }
    }
}
