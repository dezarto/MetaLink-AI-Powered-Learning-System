using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using Metalink.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;
using MetaLink.Domain.Enums;

namespace MetaLink.Persistence.Repositories
{
    public class CourseProgressRepository : ICourseProgressRepository
    {
        private readonly AppDbContext _context;

        public CourseProgressRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<CourseProgress> GetCourseProgressByStudentIdAsync(int studentId, int courseId, ProgressTypeEnum progressTypeEnum)
        {
            return await _context.CourseProgresses
                .Where(c => c.StudentID == studentId && c.CourseID == courseId && c.ProgressType == progressTypeEnum)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<CourseProgress>> GetAllCourseProgressesAsync()
        {
            return await _context.CourseProgresses.ToListAsync();
        }

        public async Task<CourseProgress> CreateCourseProgressAsync(CourseProgress courseProgress)
        {
            _context.CourseProgresses.Add(courseProgress);
            await _context.SaveChangesAsync();
            return courseProgress;
        }

        public async Task<CourseProgress> UpdateCourseProgressAsync(CourseProgress courseProgress)
        {
            _context.CourseProgresses.Update(courseProgress);
            await _context.SaveChangesAsync();
            return courseProgress;
        }

        public async Task<bool> DeleteCourseProgressAsync(int progressId)
        {
            var courseProgress = await _context.CourseProgresses.FindAsync(progressId);
            if (courseProgress == null)
                return false;

            _context.CourseProgresses.Remove(courseProgress);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
