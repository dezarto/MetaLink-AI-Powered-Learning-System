using Metalink.Domain.Entities;
using Metalink.Domain.Interfaces;
using Metalink.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace Metalink.Infrastructure.Repositories
{
    public class LessonRepository : ILessonRepository
    {
        private readonly AppDbContext _context;
        public LessonRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Lesson lesson)
        {
            await _context.Lessons.AddAsync(lesson);
        }

        public async Task UpdateAsync(Lesson lesson)
        {
            _context.Lessons.Update(lesson);
        }

        public async Task DeleteAsync(Lesson lesson)
        {
            _context.Lessons.Remove(lesson);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public async Task<List<Lesson>> GetAllAsync()
        {
            return await _context.Lessons.ToListAsync();
        }

        public async Task<Lesson?> GetByIdAsync(int id)
        {
            return await _context.Lessons.FindAsync(id);
        }

        public async Task<List<Lesson>> GetByCourseIdAsync(int courseId)
        {
            return await _context.Lessons
                .Where(l => l.CourseID == courseId)
                .ToListAsync();
        }
    }
}
