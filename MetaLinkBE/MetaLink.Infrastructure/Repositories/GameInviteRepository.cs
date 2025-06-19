using Metalink.Infrastructure.Context;
using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MetaLink.Persistence.Repositories
{
    public class GameInviteRepository : IGameInviteRepository
    {
        private readonly AppDbContext _context;

        public GameInviteRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddInviteAsync(GameInvite invite)
        {
            await _context.GameInvites.AddAsync(invite);
            await _context.SaveChangesAsync();
        }

        public async Task<GameInvite?> GetPendingInviteAsync(int toStudentId)
        {
            return await _context.GameInvites
                .FirstOrDefaultAsync(i =>
                    i.ToStudentId == toStudentId &&
                    !i.IsAccepted &&
                    !i.IsCancelled);
        }

        public async Task<GameInvite> AcceptInviteAsync(int inviteId)
        {
            var invite = await _context.GameInvites.FindAsync(inviteId);
            if (invite != null)
            {
                invite.IsAccepted = true;
                invite.AcceptedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
            return invite;
        }

        public async Task<GameInvite> CancelInviteAsync(int inviteId)
        {
            var invite = await _context.GameInvites.FindAsync(inviteId);
            if (invite != null)
            {
                invite.IsCancelled = true;
                await _context.SaveChangesAsync();
            }

            return invite;
        }

        public async Task<GameInvite?> GetInviteByIdAsync(int inviteId)
        {
            return await _context.GameInvites
                .FirstOrDefaultAsync(i => i.Id == inviteId);
        }

        public async Task<List<GameInvite>> GetAllInvite()
        {
            return await _context.GameInvites.ToListAsync();
        }

        public async Task DeleteInvite(int inviteId)
        {
            var invite = await _context.GameInvites.FindAsync(inviteId);
            if (invite != null)
            {
                _context.GameInvites.Remove(invite);
                await _context.SaveChangesAsync();
            }
        }
    }
}
