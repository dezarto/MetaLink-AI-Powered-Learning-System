using Metalink.Domain.Interfaces;
using Metalink.Infrastructure.Context;
using MetaLink.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Metalink.Infrastructure.Repositories
{
    public class AvatarRepository : IAvatarRepository
    {
        private readonly AppDbContext _context;

        public AvatarRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Avatar>> GetAllAsync()
        {
            return await _context.Avatars.ToListAsync();
        }

        public async Task<Avatar> GetByIdAsync(int avatarId)
        {
            return await _context.Avatars.FindAsync(avatarId);
        }

        public async Task AddAsync(Avatar avatar)
        {
            await _context.Avatars.AddAsync(avatar);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Avatar avatar)
        {
            _context.Avatars.Update(avatar);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int avatarId)
        {
            var avatar = await _context.Avatars.FindAsync(avatarId);
            if (avatar != null)
            {
                _context.Avatars.Remove(avatar);
                await _context.SaveChangesAsync();
            }
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
