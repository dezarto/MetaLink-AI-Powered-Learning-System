using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using Metalink.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;
using Metalink.Domain.Entities;

namespace MetaLink.Persistence.Repositories
{
    public class GameProgressRepository : IGameProgressRepository
    {
        private readonly AppDbContext _context;

        public GameProgressRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<GameProgress> GetByIdAsync(int id)
        {
            return await _context.GameProgress.FindAsync(id);
        }

        public async Task<GameProgress> GetByStudentAndGameAsync(int studentId, int gameId)
        {
            return await _context.GameProgress
                .FirstOrDefaultAsync(p => p.StudentId == studentId && p.GameId == gameId);
        }

        public async Task<List<GameProgress>> GetByStudentIdAsync(int studentId)
        {
            return await _context.GameProgress
                .Where(p => p.StudentId == studentId)
                .ToListAsync();
        }

        public async Task AddAsync(GameProgress gameProgress)
        {
            await _context.GameProgress.AddAsync(gameProgress);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(GameProgress gameProgress)
        {
            _context.GameProgress.Update(gameProgress);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var gameProgress = await GetByIdAsync(id);
            if (gameProgress != null)
            {
                _context.GameProgress.Remove(gameProgress);
                await _context.SaveChangesAsync();
            }
        }
    }
}
