using Metalink.Domain.Entities;
using Metalink.Domain.Interfaces;
using Metalink.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace Metalink.Infrastructure.Repositories
{
    public class SubLessonRepository : ISubLessonRepository
    {
        private readonly AppDbContext _context;
        public SubLessonRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(SubLesson subLesson)
        {
            await _context.SubLessons.AddAsync(subLesson);
        }

        public async Task DeleteAsync(SubLesson subLesson)
        {
            _context.SubLessons.Remove(subLesson);
        }

        public async Task<List<SubLesson>> GetAllAsync()
        {
            return await _context.SubLessons.ToListAsync();
        }

        public async Task<SubLesson?> GetByIdAsync(int id)
        {
            return await _context.SubLessons.FindAsync(id);
        }

        // Ek metod: Belirli bir lesson'a ait tüm sublesson'ları döndürür.
        public async Task<List<SubLesson>> GetByLessonIdAsync(int lessonId)
        {
            return await _context.SubLessons
                .Where(sl => sl.LessonID == lessonId)
                .ToListAsync();
        }

        public async Task UpdateAsync(SubLesson subLesson)
        {
            _context.SubLessons.Update(subLesson);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
