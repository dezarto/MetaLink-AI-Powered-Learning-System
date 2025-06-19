using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using Metalink.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MetaLink.Persistence.Repositories
{
    public class SubLessonProgressRepository : ISubLessonProgressRepository
    {
        private readonly IServiceScopeFactory _scopeFactory;

        public SubLessonProgressRepository(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        public async Task<SubLessonProgress?> GetSubLessonProgressByStudentIdAsync(int studentId, int subLessonId)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            return await context.SubLessonProgresses
                .Where(s => s.StudentID == studentId && s.SubLessonID == subLessonId)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<SubLessonProgress>> GetAllSubLessonProgressesAsync()
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            return await context.SubLessonProgresses.ToListAsync();
        }

        public async Task<SubLessonProgress> CreateSubLessonProgressAsync(SubLessonProgress subLessonProgress)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            context.SubLessonProgresses.Add(subLessonProgress);
            await context.SaveChangesAsync();
            return subLessonProgress;
        }

        public async Task<SubLessonProgress> UpdateSubLessonProgressAsync(SubLessonProgress subLessonProgress)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            context.SubLessonProgresses.Update(subLessonProgress);
            await context.SaveChangesAsync();
            return subLessonProgress;
        }

        public async Task<bool> DeleteSubLessonProgressAsync(int progressId)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var subLessonProgress = await context.SubLessonProgresses.FindAsync(progressId);
            if (subLessonProgress == null)
                return false;

            context.SubLessonProgresses.Remove(subLessonProgress);
            await context.SaveChangesAsync();
            return true;
        }
    }

}
