using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using Metalink.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace MetaLink.Persistence.Repositories
{
    public class ReviewSessionRepository : IReviewSessionRepository
    {
        private readonly AppDbContext _context;

        public ReviewSessionRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ReviewSession> GetByIdAsync(int id)
        {
            return await _context.ReviewSessions.FindAsync(id);
        }

        public async Task<IEnumerable<ReviewSession>> GetByStudentIdAsync(int studentId)
        {
            return await _context.ReviewSessions
                .Where(rs => rs.StudentId == studentId)
                .ToListAsync();
        }

        public async Task AddAsync(ReviewSession session)
        {
            await _context.ReviewSessions.AddAsync(session);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(ReviewSession session)
        {
            _context.ReviewSessions.Update(session);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var entity = await _context.ReviewSessions.FindAsync(id);
            if (entity != null)
            {
                _context.ReviewSessions.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }
    }
}
