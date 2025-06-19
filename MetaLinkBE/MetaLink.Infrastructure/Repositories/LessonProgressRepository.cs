using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using Metalink.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;
using MetaLink.Domain.Enums;

namespace MetaLink.Persistence.Repositories
{
    public class LessonProgressRepository : ILessonProgressRepository
    {
        private readonly AppDbContext _context;

        public LessonProgressRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<LessonProgress> GetLessonProgressByStudentIdAsync(int studentId, int lessonId, ProgressTypeEnum progressTypeEnum)
        {
            return await _context.LessonProgresses
                .Where(l => l.StudentID == studentId && l.LessonID == lessonId && l.ProgressType == progressTypeEnum)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<LessonProgress>> GetAllLessonProgressesAsync()
        {
            return await _context.LessonProgresses.ToListAsync();
        }

        public async Task<LessonProgress> CreateLessonProgressAsync(LessonProgress lessonProgress)
        {
            _context.LessonProgresses.Add(lessonProgress);
            await _context.SaveChangesAsync();
            return lessonProgress;
        }

        public async Task<LessonProgress> UpdateLessonProgressAsync(LessonProgress lessonProgress)
        {
            _context.LessonProgresses.Update(lessonProgress);
            await _context.SaveChangesAsync();
            return lessonProgress;
        }

        public async Task<bool> DeleteLessonProgressAsync(int progressId)
        {
            var lessonProgress = await _context.LessonProgresses.FindAsync(progressId);
            if (lessonProgress == null)
                return false;

            _context.LessonProgresses.Remove(lessonProgress);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
